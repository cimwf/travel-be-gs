import { create } from 'zustand';
import { adminBatchCreate, adminCreate, adminDelete, adminGet, adminList, adminUpdate } from '@/utils/adminApi';
import type { Attraction, PaginatedResponse } from '@/types';

interface AttractionsState {
  attractions: Attraction[];
  currentAttraction: Attraction | null;
  loading: boolean;
  total: number;

  fetchList: (params: {
    page: number;
    pageSize: number;
    keyword?: string;
    category?: string;
    location?: string;
  }) => Promise<PaginatedResponse<Attraction>>;

  fetchById: (id: string) => Promise<Attraction | null>;
  create: (data: Partial<Attraction>) => Promise<{ success: boolean; message: string }>;
  update: (id: string, data: Partial<Attraction>) => Promise<{ success: boolean; message: string }>;
  delete: (id: string) => Promise<{ success: boolean; message: string }>;
  updateSortOrder: (id: string, sortOrder: number) => Promise<{ success: boolean; message: string }>;
  initSortOrder: () => Promise<{ success: boolean; message: string }>;
  batchCreate: (items: Partial<Attraction>[]) => Promise<{ success: boolean; message: string; count: number }>;
}

export const useAttractionsStore = create<AttractionsState>((set) => ({
  attractions: [],
  currentAttraction: null,
  loading: false,
  total: 0,

  fetchList: async ({ page, pageSize, keyword, category, location }) => {
    set({ loading: true });

    try {
      const result = await adminList<Attraction>('places', { page, pageSize, keyword, filters: { category, location } });
      if (!result.success) throw new Error(result.error);
      const total = result.total || 0;
      const list = result.items || [];

      set({
        attractions: list,
        total,
        loading: false,
      });

      return { list, total, page, pageSize };
    } catch (error) {
      console.error('Fetch attractions error:', error);
      set({ loading: false, attractions: [], total: 0 });
      return { list: [], total: 0, page, pageSize };
    }
  },

  fetchById: async (id: string) => {
    set({ loading: true });

    try {
      const result = await adminGet<Attraction>('places', id);
      const data = result.item || null;

      set({ currentAttraction: data, loading: false });
      return data;
    } catch (error) {
      console.error('Fetch attraction error:', error);
      set({ currentAttraction: null, loading: false });
      return null;
    }
  },

  create: async (data: Partial<Attraction>) => {
    try {
      const countResult = await adminList<Attraction>('places', { page: 1, pageSize: 1 });
      const maxSortOrder = countResult.total || 0;

      const newPlace = {
        ...data,
        wantCount: 0,
        visitCount: 0,
        tripCount: 0,
        sortOrder: maxSortOrder + 1,
        createdAt: Date.now(),
      };

      const result = await adminCreate('places', newPlace);
      if (!result.success) throw new Error(result.error);

      return { success: true, message: '添加成功' };
    } catch (error) {
      console.error('Create attraction error:', error);
      return { success: false, message: '添加失败，请重试' };
    }
  },

  update: async (id: string, data: Partial<Attraction>) => {
    try {
      const result = await adminUpdate('places', id, data as Record<string, unknown>);
      if (!result.success) throw new Error(result.error);

      return { success: true, message: '更新成功' };
    } catch (error) {
      console.error('Update attraction error:', error);
      return { success: false, message: '更新失败，请重试' };
    }
  },

  delete: async (id: string) => {
    try {
      const result = await adminDelete('places', id);
      if (!result.success) throw new Error(result.error);

      return { success: true, message: '删除成功' };
    } catch (error) {
      console.error('Delete attraction error:', error);
      return { success: false, message: '删除失败，请重试' };
    }
  },

  updateSortOrder: async (id: string, sortOrder: number) => {
    try {
      const result = await adminUpdate('places', id, { sortOrder });
      if (!result.success) throw new Error(result.error);

      return { success: true, message: '排序更新成功' };
    } catch (error) {
      console.error('Update sort order error:', error);
      return { success: false, message: '排序更新失败' };
    }
  },

  initSortOrder: async () => {
    try {
      const result = await adminList<Attraction>('places', { page: 1, pageSize: 1000, orderBy: [['createdAt', 'asc']] });
      if (!result.success) throw new Error(result.error);
      const list = result.items || [];

      // 强制重新设置所有数据的 sortOrder
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        await adminUpdate('places', item._id!, { sortOrder: i + 1 });
      }

      return { success: true, message: `已初始化 ${list.length} 条数据的排序` };
    } catch (error) {
      console.error('Init sort order error:', error);
      return { success: false, message: '初始化排序失败' };
    }
  },

  batchCreate: async (items: Partial<Attraction>[]) => {
    try {
      const countResult = await adminList<Attraction>('places', { page: 1, pageSize: 1 });
      let baseSortOrder = countResult.total || 0;

      const newItems = items.map((item) => ({
            ...item,
            wantCount: item.wantCount || 0,
            visitCount: item.visitCount || 0,
            tripCount: item.tripCount || 0,
            sortOrder: item.sortOrder || ++baseSortOrder,
            createdAt: item.createdAt || Date.now(),
          }));
      const result = await adminBatchCreate('places', newItems as Record<string, unknown>[]);
      if (!result.success) throw new Error(result.error);
      const successCount = result.count || 0;

      return { success: true, message: `成功导入 ${successCount} 条数据`, count: successCount };
    } catch (error) {
      console.error('Batch create error:', error);
      return { success: false, message: '批量导入失败', count: 0 };
    }
  },
}));
