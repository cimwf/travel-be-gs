import { create } from 'zustand';
import { getDb, initCloudBase } from '@/utils/cloudbase';
import type { AIImageQuota } from '@/types';

const COLLECTION = 'ai_image_quotas';
const USER_COLLECTION = 'users';
const SEARCH_FIELDS = ['userId', 'appUserId', 'nickname', 'phone', 'phoneMask'] as const;
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

interface AIImageQuotaState {
  quotas: AIImageQuota[];
  loading: boolean;
  total: number;

  fetchList: (params: { page: number; pageSize: number; keyword?: string }) => Promise<{ list: AIImageQuota[]; total: number }>;
  updateTotal: (id: string, total: number, used?: number) => Promise<{ success: boolean; message: string }>;
  create: (data: Partial<AIImageQuota>) => Promise<{ success: boolean; message: string }>;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function maskPhone(phone?: string) {
  const value = String(phone || '').trim();
  return /^1\d{10}$/.test(value) ? value.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2') : value;
}

function buildQuotaUserInfo(user?: UserSnapshot): Partial<AIImageQuota> {
  if (!user) return {};

  return {
    appUserId: user.userId || '',
    nickname: user.nickname || '',
    phone: user.phone || '',
    phoneMask: user.phoneMask || maskPhone(user.phone),
    avatar: user.avatar || '',
  };
}

function shouldHydrateQuotaUserInfo(quota: AIImageQuota) {
  return !quota.appUserId || !quota.nickname || !quota.phoneMask;
}

function getUserInfoPatch(quota: AIImageQuota, userInfo: Partial<AIImageQuota>) {
  const patch: Partial<AIImageQuota> = {};
  (['appUserId', 'nickname', 'phone', 'phoneMask', 'avatar'] as const).forEach((key) => {
    if (userInfo[key] && quota[key] !== userInfo[key]) {
      patch[key] = userInfo[key];
    }
  });
  return patch;
}

async function findUserByKeyword(db: DbClient, keyword: string): Promise<UserSnapshot | null> {
  const value = keyword.trim();
  if (!value) return null;

  for (const field of USER_SEARCH_FIELDS) {
    const result = await db.collection(USER_COLLECTION)
      .where({ [field]: value })
      .limit(1)
      .get();
    if (result.data && result.data[0]) {
      return result.data[0] as UserSnapshot;
    }
  }

  return null;
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

async function hydrateQuotaUserInfo(db: DbClient, quota: AIImageQuota): Promise<AIImageQuota> {
  if (!quota.userId || !shouldHydrateQuotaUserInfo(quota)) {
    return quota;
  }

  const user = await findUserByKeyword(db, quota.userId);
  if (!user) return quota;

  const userInfo = buildQuotaUserInfo(user);
  const patch = getUserInfoPatch(quota, userInfo);
  if (quota._id && Object.keys(patch).length > 0) {
    await db.collection(COLLECTION).doc(quota._id).update({
      ...patch,
      updatedAt: Date.now(),
    });
  }

  return { ...quota, ...patch };
}

function addQuotaToMap(map: Map<string, AIImageQuota>, quota: AIImageQuota, userInfo?: Partial<AIImageQuota>) {
  const key = quota._id || quota.userId;
  if (!key) return;
  const current = map.get(key);
  map.set(key, { ...current, ...quota, ...userInfo });
}

export const useAIImageQuotaStore = create<AIImageQuotaState>((set) => ({
  quotas: [],
  loading: false,
  total: 0,

  fetchList: async ({ page, pageSize, keyword = '' }) => {
    set({ loading: true });

    try {
      await initCloudBase();
      const db = getDb();
      const keywordValue = keyword.trim();

      if (keywordValue) {
        const regexp = db.RegExp({
          regexp: escapeRegExp(keywordValue),
          options: 'i',
        });
        const quotaMap = new Map<string, AIImageQuota>();

        for (const field of SEARCH_FIELDS) {
          const result = await db.collection(COLLECTION)
            .where({ [field]: regexp })
            .limit(200)
            .get();
          ((result.data || []) as AIImageQuota[]).forEach((item) => addQuotaToMap(quotaMap, item));
        }

        const users = await searchUsersByKeyword(db, keywordValue);
        for (const user of users) {
          const userInfo = buildQuotaUserInfo(user);
          const keys = [user.openid, user.userId].filter(Boolean) as string[];
          for (const userId of keys) {
            const quotaResult = await db.collection(COLLECTION)
              .where({ userId })
              .limit(1)
              .get();
            ((quotaResult.data || []) as AIImageQuota[]).forEach((item) => addQuotaToMap(quotaMap, item, userInfo));
          }
        }

        const hydrated = await Promise.all(
          Array.from(quotaMap.values()).map((item) => hydrateQuotaUserInfo(db, item))
        );
        hydrated.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        const total = hydrated.length;
        const list = hydrated.slice((page - 1) * pageSize, page * pageSize);
        set({ quotas: list, total, loading: false });
        return { list, total };
      }

      const countResult = await db.collection(COLLECTION).count();
      const result = await db
        .collection(COLLECTION)
        .orderBy('updatedAt', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();

      const list = await Promise.all(
        ((result.data || []) as AIImageQuota[]).map((item) => hydrateQuotaUserInfo(db, item))
      );
      const total = countResult.total || 0;
      set({ quotas: list, total, loading: false });
      return { list, total };
    } catch (error) {
      console.error('Fetch AI image quotas error:', error);
      set({ quotas: [], total: 0, loading: false });
      return { list: [], total: 0 };
    }
  },

  updateTotal: async (id, total, used) => {
    try {
      await initCloudBase();
      const db = getDb();
      const data: Partial<AIImageQuota> & { updatedAt: number } = {
        total: Math.max(0, Number(total) || 0),
        updatedAt: Date.now(),
      };

      if (used !== undefined) {
        data.used = Math.max(0, Number(used) || 0);
      }

      await db.collection(COLLECTION).doc(id).update(data);
      return { success: true, message: '额度更新成功' };
    } catch (error) {
      console.error('Update AI image quota error:', error);
      return { success: false, message: '额度更新失败' };
    }
  },

  create: async (data) => {
    try {
      await initCloudBase();
      const db = getDb();
      const now = Date.now();
      const inputUserId = String(data.userId || '').trim();

      if (!inputUserId) {
        return { success: false, message: '请输入用户 openid / userId / 手机号' };
      }

      const user = await findUserByKeyword(db, inputUserId);
      if (user && !user.openid) {
        return { success: false, message: '该用户暂无 openid，无法创建 AI 额度' };
      }
      const userId = user?.openid || inputUserId;
      const userInfo = user
        ? buildQuotaUserInfo(user)
        : {
            appUserId: data.appUserId || '',
            nickname: data.nickname || '',
            phone: data.phone || '',
            phoneMask: data.phoneMask || maskPhone(data.phone),
            avatar: data.avatar || '',
          };

      const existed = await db.collection(COLLECTION)
        .where({ userId })
        .limit(1)
        .get();

      if (existed.data && existed.data.length > 0) {
        return { success: false, message: '该用户已有额度记录，请直接修改 total' };
      }

      await db.collection(COLLECTION).add({
        userId,
        ...userInfo,
        total: typeof data.total === 'number' ? Math.max(0, data.total) : 3,
        used: typeof data.used === 'number' ? Math.max(0, data.used) : 0,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, message: '额度创建成功' };
    } catch (error) {
      console.error('Create AI image quota error:', error);
      return { success: false, message: '额度创建失败' };
    }
  },
}));
