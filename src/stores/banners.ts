import { create } from 'zustand';
import { getDb, initCloudBase } from '@/utils/cloudbase';

export interface BannerItem {
  _id: string;
  image: string;
  title: string;
  linkType: 'attraction' | 'hotel' | 'url';
  linkId: string;
  linkName: string;
  sort: number;
  enabled: boolean;
  createdAt: number;
}

interface BannerState {
  banners: BannerItem[];
  loading: boolean;
  total: number;

  fetchList: (params: { page: number; pageSize: number }) => Promise<void>;
  create: (data: Partial<BannerItem>) => Promise<{ success: boolean; message: string }>;
  update: (id: string, data: Partial<BannerItem>) => Promise<{ success: boolean; message: string }>;
  delete: (id: string) => Promise<{ success: boolean; message: string }>;
  updateSort: (id: string, sort: number) => Promise<{ success: boolean; message: string }>;
  toggleEnabled: (id: string, enabled: boolean) => Promise<{ success: boolean; message: string }>;
}

const COLLECTION = 'banners';

export const useBannerStore = create<BannerState>((set, get) => ({
  banners: [],
  loading: false,
  total: 0,

  fetchList: async ({ page, pageSize }) => {
    set({ loading: true });

    try {
      await initCloudBase();
      const db = getDb();

      // 获取总数
      const countResult = await db.collection(COLLECTION).count();
      const total = countResult.total;

      // 分页查询，按排序权重升序
      const result = await db
        .collection(COLLECTION)
        .orderBy('sort', 'asc')
        .orderBy('createdAt', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();

      set({
        banners: (result.data || []) as BannerItem[],
        total,
        loading: false,
      });
    } catch (error) {
      console.error('Fetch banners error:', error);
      set({ banners: [], total: 0, loading: false });
    }
  },

  create: async (data) => {
    try {
      await initCloudBase();
      const db = getDb();

      // 获取当前最大排序值
      const result = await db.collection(COLLECTION).orderBy('sort', 'desc').limit(1).get();
      const maxSort = result.data && result.data.length > 0 ? result.data[0].sort : 0;

      await db.collection(COLLECTION).add({
        ...data,
        sort: data.sort ?? maxSort + 1,
        enabled: data.enabled ?? true,
        createdAt: Date.now(),
      });

      // 刷新列表
      get().fetchList({ page: 1, pageSize: 10 });

      return { success: true, message: '创建成功' };
    } catch (error) {
      console.error('Create banner error:', error);
      return { success: false, message: '创建失败' };
    }
  },

  update: async (id, data) => {
    try {
      await initCloudBase();
      const db = getDb();

      await db.collection(COLLECTION).doc(id).update(data);

      // 刷新列表
      const currentPage = Math.ceil(get().banners.length / 10) || 1;
      get().fetchList({ page: currentPage, pageSize: 10 });

      return { success: true, message: '更新成功' };
    } catch (error) {
      console.error('Update banner error:', error);
      return { success: false, message: '更新失败' };
    }
  },

  delete: async (id) => {
    try {
      await initCloudBase();
      const db = getDb();

      await db.collection(COLLECTION).doc(id).remove();

      // 刷新列表
      get().fetchList({ page: 1, pageSize: 10 });

      return { success: true, message: '删除成功' };
    } catch (error) {
      console.error('Delete banner error:', error);
      return { success: false, message: '删除失败' };
    }
  },

  updateSort: async (id, sort) => {
    try {
      await initCloudBase();
      const db = getDb();

      await db.collection(COLLECTION).doc(id).update({ sort });

      // 刷新列表
      get().fetchList({ page: 1, pageSize: 10 });

      return { success: true, message: '排序更新成功' };
    } catch (error) {
      console.error('Update sort error:', error);
      return { success: false, message: '排序更新失败' };
    }
  },

  toggleEnabled: async (id, enabled) => {
    try {
      await initCloudBase();
      const db = getDb();

      await db.collection(COLLECTION).doc(id).update({ enabled });

      // 更新本地状态
      set({
        banners: get().banners.map((b) =>
          b._id === id ? { ...b, enabled } : b
        ),
      });

      return { success: true, message: enabled ? '已启用' : '已禁用' };
    } catch (error) {
      console.error('Toggle enabled error:', error);
      return { success: false, message: '操作失败' };
    }
  },
}));
