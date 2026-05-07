import { create } from 'zustand';
import { getDb, initCloudBase } from '@/utils/cloudbase';
import type { AIImageOrder } from '@/types';

const COLLECTION = 'ai_image_orders';
const USER_COLLECTION = 'users';
const QUOTA_COLLECTION = 'ai_image_quotas';
const SEARCH_FIELDS = ['orderNo', 'userId', 'appUserId', 'nickname', 'phone', 'phoneMask', 'title', 'packageKey'] as const;
const USER_SEARCH_FIELDS = ['openid', 'userId', 'nickname', 'phone', 'phoneMask'] as const;

type DbClient = ReturnType<typeof getDb>;

interface UserSnapshot {
  _id?: string;
  openid?: string;
  userId?: string;
  nickname?: string;
  phone?: string;
  phoneMask?: string;
  avatar?: string;
}

interface AIImageOrderState {
  orders: AIImageOrder[];
  loading: boolean;
  total: number;
  fetchList: (params: {
    page: number;
    pageSize: number;
    keyword?: string;
    status?: string;
  }) => Promise<{ list: AIImageOrder[]; total: number }>;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function maskPhone(phone?: string) {
  const value = String(phone || '').trim();
  return /^1\d{10}$/.test(value) ? value.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2') : value;
}

function buildUserInfo(user?: UserSnapshot | Partial<AIImageOrder>): Partial<AIImageOrder> {
  if (!user) return {};

  return {
    appUserId: 'appUserId' in user ? user.appUserId || '' : user.userId || '',
    nickname: user.nickname || '',
    phone: user.phone || '',
    phoneMask: user.phoneMask || maskPhone(user.phone),
    avatar: user.avatar || '',
  };
}

function shouldHydrateOrderUserInfo(order: AIImageOrder) {
  return !order.appUserId || !order.nickname || !order.phoneMask;
}

function getUserInfoPatch(order: AIImageOrder, userInfo: Partial<AIImageOrder>) {
  const patch: Partial<AIImageOrder> = {};
  (['appUserId', 'nickname', 'phone', 'phoneMask', 'avatar'] as const).forEach((key) => {
    if (userInfo[key] && order[key] !== userInfo[key]) {
      patch[key] = userInfo[key];
    }
  });
  return patch;
}

async function findUserInfo(db: DbClient, userId: string): Promise<Partial<AIImageOrder>> {
  if (!userId) return {};

  for (const field of USER_SEARCH_FIELDS) {
    const result = await db.collection(USER_COLLECTION)
      .where({ [field]: userId })
      .limit(1)
      .get();
    if (result.data && result.data[0]) {
      return buildUserInfo(result.data[0] as UserSnapshot);
    }
  }

  const quotaResult = await db.collection(QUOTA_COLLECTION)
    .where({ userId })
    .limit(1)
    .get();
  if (quotaResult.data && quotaResult.data[0]) {
    return buildUserInfo(quotaResult.data[0] as Partial<AIImageOrder>);
  }

  return {};
}

async function searchUsersByKeyword(db: DbClient, keyword: string): Promise<UserSnapshot[]> {
  const regexp = db.RegExp({
    regexp: escapeRegExp(keyword),
    options: 'i',
  });
  const map = new Map<string, UserSnapshot>();

  for (const field of USER_SEARCH_FIELDS) {
    const result = await db.collection(USER_COLLECTION)
      .where({ [field]: regexp })
      .limit(100)
      .get();
    ((result.data || []) as UserSnapshot[]).forEach((item) => {
      const key = item._id || item.openid || item.userId || item.phone || '';
      if (key) map.set(key, item);
    });
  }

  return Array.from(map.values());
}

async function hydrateOrderUserInfo(db: DbClient, order: AIImageOrder): Promise<AIImageOrder> {
  if (!order.userId || !shouldHydrateOrderUserInfo(order)) {
    return order;
  }

  const userInfo = await findUserInfo(db, order.userId);
  const patch = getUserInfoPatch(order, userInfo);
  if (order._id && Object.keys(patch).length > 0) {
    await db.collection(COLLECTION).doc(order._id).update({
      ...patch,
      updatedAt: Date.now(),
    });
  }

  return { ...order, ...patch };
}

function addOrderToMap(map: Map<string, AIImageOrder>, order: AIImageOrder, userInfo?: Partial<AIImageOrder>) {
  const key = order._id || order.orderNo || `${order.userId}_${order.createdAt || ''}`;
  if (!key) return;
  const current = map.get(key);
  map.set(key, { ...current, ...order, ...userInfo });
}

export const useAIImageOrderStore = create<AIImageOrderState>((set) => ({
  orders: [],
  loading: false,
  total: 0,

  fetchList: async ({ page, pageSize, keyword = '', status = 'all' }) => {
    set({ loading: true });

    try {
      await initCloudBase();
      const db = getDb();
      const keywordValue = keyword.trim();
      const statusValue = status && status !== 'all' ? status : '';
      const baseWhere: Record<string, unknown> = {};
      if (statusValue) baseWhere.status = statusValue;

      if (keywordValue) {
        const regexp = db.RegExp({
          regexp: escapeRegExp(keywordValue),
          options: 'i',
        });
        const orderMap = new Map<string, AIImageOrder>();

        for (const field of SEARCH_FIELDS) {
          const result = await db.collection(COLLECTION)
            .where({ ...baseWhere, [field]: regexp })
            .limit(200)
            .get();
          ((result.data || []) as AIImageOrder[]).forEach((item) => addOrderToMap(orderMap, item));
        }

        const users = await searchUsersByKeyword(db, keywordValue);
        for (const user of users) {
          const userInfo = buildUserInfo(user);
          const keys = [user.openid, user.userId].filter(Boolean) as string[];
          for (const userId of keys) {
            const result = await db.collection(COLLECTION)
              .where({ ...baseWhere, userId })
              .limit(100)
              .get();
            ((result.data || []) as AIImageOrder[]).forEach((item) => addOrderToMap(orderMap, item, userInfo));
          }
        }

        const hydrated = await Promise.all(
          Array.from(orderMap.values()).map((item) => hydrateOrderUserInfo(db, item))
        );
        hydrated.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        const total = hydrated.length;
        const list = hydrated.slice((page - 1) * pageSize, page * pageSize);
        set({ orders: list, total, loading: false });
        return { list, total };
      }

      const query = db.collection(COLLECTION).where(baseWhere);
      const countResult = await query.count();
      const result = await db.collection(COLLECTION)
        .where(baseWhere)
        .orderBy('createdAt', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();

      const list = await Promise.all(
        ((result.data || []) as AIImageOrder[]).map((item) => hydrateOrderUserInfo(db, item))
      );
      const total = countResult.total || 0;
      set({ orders: list, total, loading: false });
      return { list, total };
    } catch (error) {
      console.error('Fetch AI image orders error:', error);
      set({ orders: [], total: 0, loading: false });
      return { list: [], total: 0 };
    }
  },
}));
