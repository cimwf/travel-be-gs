import { create } from 'zustand';
import { getDb, initCloudBase } from '@/utils/cloudbase';
import type { AIImageChannel } from '@/types';

const COLLECTION = 'ai_image_channels';
const SEARCH_FIELDS = ['channelId', 'name', 'remark'] as const;

interface AIImageChannelState {
  channels: AIImageChannel[];
  loading: boolean;
  total: number;

  fetchList: (params: { page: number; pageSize: number; keyword?: string }) => Promise<{ list: AIImageChannel[]; total: number }>;
  create: (data: Partial<AIImageChannel>) => Promise<{ success: boolean; message: string }>;
  update: (id: string, data: Partial<AIImageChannel>) => Promise<{ success: boolean; message: string }>;
  delete: (id: string) => Promise<{ success: boolean; message: string }>;
  toggleEnabled: (id: string, enabled: boolean) => Promise<{ success: boolean; message: string }>;
  setDefault: (id: string) => Promise<{ success: boolean; message: string }>;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
}

function normalizeChannelId(value: unknown) {
  return String(value || '').trim().replace(/\s+/g, '_');
}

function normalizeChannel(data: Partial<AIImageChannel>) {
  return {
    channelId: normalizeChannelId(data.channelId),
    name: String(data.name || '').trim(),
    remark: String(data.remark || '').trim(),
    enabled: data.enabled !== false,
    isDefault: data.isDefault === true,
    callCount: normalizeNumber(data.callCount),
    successCount: normalizeNumber(data.successCount),
    failCount: normalizeNumber(data.failCount),
  };
}

function normalizeChannelRecord(item: Partial<AIImageChannel>): AIImageChannel {
  return {
    _id: item._id || '',
    ...normalizeChannel(item),
    createdAt: normalizeNumber(item.createdAt),
    updatedAt: normalizeNumber(item.updatedAt),
  };
}

function sortChannels(list: AIImageChannel[]) {
  return list.sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });
}

async function channelIdExists(db: ReturnType<typeof getDb>, channelId: string, ignoreId = '') {
  const result = await db.collection(COLLECTION)
    .where({ channelId })
    .limit(1)
    .get();
  const existed = result.data && result.data[0] ? result.data[0] as AIImageChannel : null;
  return Boolean(existed && existed._id !== ignoreId);
}

async function clearOtherDefaultChannels(db: ReturnType<typeof getDb>, currentId = '') {
  const result = await db.collection(COLLECTION)
    .where({ isDefault: true })
    .limit(200)
    .get();

  const updateTasks = ((result.data || []) as AIImageChannel[])
    .filter((item) => item._id && item._id !== currentId)
    .map((item) => db.collection(COLLECTION).doc(item._id as string).update({
      isDefault: false,
      updatedAt: Date.now(),
    }));

  await Promise.all(updateTasks);
}

export function generateAIImageChannelId() {
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `channel_${stamp}_${random}`;
}

export const useAIImageChannelStore = create<AIImageChannelState>((set, get) => ({
  channels: [],
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
        const map = new Map<string, AIImageChannel>();

        for (const field of SEARCH_FIELDS) {
          const result = await db.collection(COLLECTION)
            .where({ [field]: regexp })
            .limit(200)
            .get();
          ((result.data || []) as AIImageChannel[]).forEach((item) => {
            const normalized = normalizeChannelRecord(item);
            const key = normalized._id || normalized.channelId;
            if (key) map.set(key, normalized);
          });
        }

        const all = sortChannels(Array.from(map.values()));
        const total = all.length;
        const list = all.slice((page - 1) * pageSize, page * pageSize);
        set({ channels: list, total, loading: false });
        return { list, total };
      }

      const countResult = await db.collection(COLLECTION).count();
      const result = await db
        .collection(COLLECTION)
        .orderBy('createdAt', 'asc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();

      const list = sortChannels(((result.data || []) as AIImageChannel[]).map((item) => normalizeChannelRecord(item)));
      const total = countResult.total || 0;
      set({ channels: list, total, loading: false });
      return { list, total };
    } catch (error) {
      console.error('Fetch AI image channels error:', error);
      set({ channels: [], total: 0, loading: false });
      return { list: [], total: 0 };
    }
  },

  create: async (data) => {
    try {
      await initCloudBase();
      const db = getDb();
      const now = Date.now();
      const channel = normalizeChannel(data);

      if (!channel.channelId) {
        return { success: false, message: '渠道 ID 不能为空' };
      }

      if (!channel.name) {
        return { success: false, message: '渠道名称不能为空' };
      }

      if (await channelIdExists(db, channel.channelId)) {
        return { success: false, message: '渠道 ID 已存在' };
      }

      if (channel.isDefault) {
        await clearOtherDefaultChannels(db);
      }

      await db.collection(COLLECTION).add({
        ...channel,
        enabled: channel.isDefault ? true : channel.enabled,
        createdAt: now,
        updatedAt: now,
      });

      return { success: true, message: '创建成功' };
    } catch (error) {
      console.error('Create AI image channel error:', error);
      return { success: false, message: '创建失败' };
    }
  },

  update: async (id, data) => {
    try {
      await initCloudBase();
      const db = getDb();
      const channel = normalizeChannel(data);

      if (!channel.channelId) {
        return { success: false, message: '渠道 ID 不能为空' };
      }

      if (!channel.name) {
        return { success: false, message: '渠道名称不能为空' };
      }

      if (await channelIdExists(db, channel.channelId, id)) {
        return { success: false, message: '渠道 ID 已存在' };
      }

      if (channel.isDefault) {
        await clearOtherDefaultChannels(db, id);
      }

      await db.collection(COLLECTION).doc(id).update({
        ...channel,
        enabled: channel.isDefault ? true : channel.enabled,
        updatedAt: Date.now(),
      });

      return { success: true, message: '更新成功' };
    } catch (error) {
      console.error('Update AI image channel error:', error);
      return { success: false, message: '更新失败' };
    }
  },

  delete: async (id) => {
    try {
      await initCloudBase();
      const db = getDb();
      await db.collection(COLLECTION).doc(id).remove();
      return { success: true, message: '删除成功' };
    } catch (error) {
      console.error('Delete AI image channel error:', error);
      return { success: false, message: '删除失败' };
    }
  },

  toggleEnabled: async (id, enabled) => {
    try {
      await initCloudBase();
      const db = getDb();
      const updateData: Partial<AIImageChannel> & { updatedAt: number } = {
        enabled,
        updatedAt: Date.now(),
      };

      if (!enabled) {
        updateData.isDefault = false;
      }

      await db.collection(COLLECTION).doc(id).update(updateData);
      set({
        channels: get().channels.map((item) => (
          item._id === id ? { ...item, enabled, isDefault: enabled ? item.isDefault : false } : item
        )),
      });
      return { success: true, message: enabled ? '已启用' : '已禁用' };
    } catch (error) {
      console.error('Toggle AI image channel error:', error);
      return { success: false, message: '操作失败' };
    }
  },

  setDefault: async (id) => {
    try {
      await initCloudBase();
      const db = getDb();
      await clearOtherDefaultChannels(db, id);
      await db.collection(COLLECTION).doc(id).update({
        isDefault: true,
        enabled: true,
        updatedAt: Date.now(),
      });
      set({
        channels: sortChannels(get().channels.map((item) => (
          item._id === id
            ? { ...item, isDefault: true, enabled: true }
            : { ...item, isDefault: false }
        ))),
      });
      return { success: true, message: '已设为默认渠道' };
    } catch (error) {
      console.error('Set default AI image channel error:', error);
      return { success: false, message: '设置失败' };
    }
  },
}));
