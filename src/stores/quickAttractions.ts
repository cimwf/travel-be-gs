import { create } from 'zustand';
import { adminBatchCreate, adminCreate, adminDelete, adminList, adminUpdate } from '@/utils/adminApi';

export interface QuickAttraction {
  _id?: string;
  name: string;
  location: string;
  coverImage: string;
  createdAt: number;
}

interface QuickAttractionsState {
  attractions: QuickAttraction[];
  loading: boolean;
  total: number;

  fetchList: (params: {
    page: number;
    pageSize: number;
    keyword?: string;
  }) => Promise<{ list: QuickAttraction[]; total: number }>;

  create: (data: Partial<QuickAttraction>) => Promise<{ success: boolean; message: string }>;
  batchCreate: (items: Partial<QuickAttraction>[]) => Promise<{ success: boolean; message: string }>;
  update: (id: string, data: Partial<QuickAttraction>) => Promise<{ success: boolean; message: string }>;
  delete: (id: string) => Promise<{ success: boolean; message: string }>;
}

export const useQuickAttractionsStore = create<QuickAttractionsState>((set) => ({
  attractions: [],
  loading: false,
  total: 0,

  fetchList: async ({ page, pageSize, keyword }) => {
    set({ loading: true });

    try {
      const result = await adminList<QuickAttraction>('quickAttractions', { page, pageSize, keyword, cloudFields: ['coverImage'] });
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
      console.error('Fetch quick attractions error:', error);
      set({ loading: false, attractions: [], total: 0 });
      return { list: [], total: 0, page, pageSize };
    }
  },

  create: async (data) => {
    try {
      const newAttraction = {
        ...data,
        createdAt: Date.now(),
      };

      const result = await adminCreate('quickAttractions', newAttraction);
      if (!result.success) throw new Error(result.error);

      return { success: true, message: '添加成功' };
    } catch (error) {
      console.error('Create quick attraction error:', error);
      return { success: false, message: '添加失败，请重试' };
    }
  },

  batchCreate: async (items) => {
    try {
      const validItems = items.filter(item => item.name);

      if (validItems.length === 0) {
        return { success: false, message: '没有有效的景点数据' };
      }

      const now = Date.now();
      const dataToInsert = validItems.map(item => ({
        name: item.name,
        location: item.location || '',
        coverImage: item.coverImage || '',
        createdAt: now,
      }));

      const result = await adminBatchCreate('quickAttractions', dataToInsert);
      if (!result.success) throw new Error(result.error);

      return { success: true, message: `成功添加 ${dataToInsert.length} 条景点` };
    } catch (error) {
      console.error('Batch create quick attractions error:', error);
      return { success: false, message: '批量添加失败，请重试' };
    }
  },

  delete: async (id: string) => {
    try {
      const result = await adminDelete('quickAttractions', id);
      if (!result.success) throw new Error(result.error);

      return { success: true, message: '删除成功' };
    } catch (error) {
      console.error('Delete quick attraction error:', error);
      return { success: false, message: '删除失败' };
    }
  },

  update: async (id: string, data) => {
    try {
      const result = await adminUpdate('quickAttractions', id, data as Record<string, unknown>);
      if (!result.success) throw new Error(result.error);

      return { success: true, message: '修改成功' };
    } catch (error) {
      console.error('Update quick attraction error:', error);
      return { success: false, message: '修改失败，请重试' };
    }
  },
}));
