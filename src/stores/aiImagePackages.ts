import { create } from 'zustand';
import { getDb, initCloudBase } from '@/utils/cloudbase';
import { defaultAIImagePackages } from '@/mock/aiImagePackages';
import type { AIImagePackage } from '@/types';

const COLLECTION = 'ai_image_packages';

interface AIImagePackageState {
  packages: AIImagePackage[];
  loading: boolean;
  total: number;

  fetchList: (params: { page: number; pageSize: number; keyword?: string }) => Promise<{ list: AIImagePackage[]; total: number }>;
  create: (data: Partial<AIImagePackage>) => Promise<{ success: boolean; message: string }>;
  update: (id: string, data: Partial<AIImagePackage>) => Promise<{ success: boolean; message: string }>;
  delete: (id: string) => Promise<{ success: boolean; message: string }>;
  toggleEnabled: (id: string, enabled: boolean) => Promise<{ success: boolean; message: string }>;
  seedDefaults: () => Promise<{ success: boolean; message: string; count: number }>;
}

function normalizePackage(data: Partial<AIImagePackage>) {
  return {
    packageId: data.packageId || '',
    title: data.title || '',
    desc: data.desc || '',
    badge: data.badge || '',
    price: typeof data.price === 'number' ? data.price : 0,
    imageCount: typeof data.imageCount === 'number' ? data.imageCount : 0,
    sort: typeof data.sort === 'number' ? data.sort : 1,
    enabled: data.enabled !== false,
  };
}

export const useAIImagePackageStore = create<AIImagePackageState>((set, get) => ({
  packages: [],
  loading: false,
  total: 0,

  fetchList: async ({ page, pageSize, keyword = '' }) => {
    set({ loading: true });

    try {
      await initCloudBase();
      const db = getDb();
      const whereCond: Record<string, unknown> = {};

      if (keyword) {
        whereCond.title = db.RegExp({
          regexp: keyword,
          options: 'i',
        });
      }

      const query = db.collection(COLLECTION).where(whereCond);
      const countResult = await query.count();
      const result = await db
        .collection(COLLECTION)
        .where(whereCond)
        .orderBy('sort', 'asc')
        .orderBy('createdAt', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();

      const list = (result.data || []) as AIImagePackage[];
      const total = countResult.total || 0;
      set({ packages: list, total, loading: false });
      return { list, total };
    } catch (error) {
      console.error('Fetch AI image packages error:', error);
      set({ packages: [], total: 0, loading: false });
      return { list: [], total: 0 };
    }
  },

  create: async (data) => {
    try {
      await initCloudBase();
      const db = getDb();
      const now = Date.now();
      await db.collection(COLLECTION).add({
        ...normalizePackage(data),
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, message: '创建成功' };
    } catch (error) {
      console.error('Create AI image package error:', error);
      return { success: false, message: '创建失败' };
    }
  },

  update: async (id, data) => {
    try {
      await initCloudBase();
      const db = getDb();
      await db.collection(COLLECTION).doc(id).update({
        ...normalizePackage(data),
        updatedAt: Date.now(),
      });
      return { success: true, message: '更新成功' };
    } catch (error) {
      console.error('Update AI image package error:', error);
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
      console.error('Delete AI image package error:', error);
      return { success: false, message: '删除失败' };
    }
  },

  toggleEnabled: async (id, enabled) => {
    try {
      await initCloudBase();
      const db = getDb();
      await db.collection(COLLECTION).doc(id).update({
        enabled,
        updatedAt: Date.now(),
      });
      set({
        packages: get().packages.map((item) => (
          item._id === id ? { ...item, enabled } : item
        )),
      });
      return { success: true, message: enabled ? '已启用' : '已禁用' };
    } catch (error) {
      console.error('Toggle AI image package error:', error);
      return { success: false, message: '操作失败' };
    }
  },

  seedDefaults: async () => {
    try {
      await initCloudBase();
      const db = getDb();
      const now = Date.now();
      let count = 0;

      for (const item of defaultAIImagePackages) {
        if (item.packageId) {
          const existed = await db.collection(COLLECTION)
            .where({ packageId: item.packageId })
            .limit(1)
            .get();
          if (existed.data && existed.data.length > 0) continue;
        }

        await db.collection(COLLECTION).add({
          ...item,
          createdAt: now,
          updatedAt: now,
        });
        count++;
      }

      return { success: true, message: `已初始化 ${count} 个套餐`, count };
    } catch (error) {
      console.error('Seed AI image packages error:', error);
      return { success: false, message: '初始化套餐失败', count: 0 };
    }
  },
}));
