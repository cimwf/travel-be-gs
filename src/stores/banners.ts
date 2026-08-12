import { create } from 'zustand';
import { adminCreate, adminDelete, adminList, adminUpdate } from '@/utils/adminApi';

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

export const useBannerStore = create<BannerState>((set, get) => ({
  banners: [],
  loading: false,
  total: 0,

  fetchList: async ({ page, pageSize }) => {
    set({ loading: true });

    try {
      const result = await adminList<BannerItem>('banners', { page, pageSize });
      if (!result.success) throw new Error(result.error);

      set({
        banners: result.items || [],
        total: result.total || 0,
        loading: false,
      });
    } catch (error) {
      console.error('Fetch banners error:', error);
      set({ banners: [], total: 0, loading: false });
    }
  },

  create: async (data) => {
    try {
      // 获取当前最大排序值
      const listResult = await adminList<BannerItem>('banners', { page: 1, pageSize: 1, orderBy: [['sort', 'desc']] });
      const maxSort = listResult.items?.[0]?.sort || 0;

      const result = await adminCreate('banners', {
        ...data,
        sort: data.sort ?? maxSort + 1,
        enabled: data.enabled ?? true,
        createdAt: Date.now(),
      });
      if (!result.success) throw new Error(result.error);

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
      const result = await adminUpdate('banners', id, data as Record<string, unknown>);
      if (!result.success) throw new Error(result.error);

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
      const result = await adminDelete('banners', id);
      if (!result.success) throw new Error(result.error);

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
      const result = await adminUpdate('banners', id, { sort });
      if (!result.success) throw new Error(result.error);

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
      const result = await adminUpdate('banners', id, { enabled });
      if (!result.success) throw new Error(result.error);

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
