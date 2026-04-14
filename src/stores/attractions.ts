import { create } from 'zustand';
import { getDb, initCloudBase } from '@/utils/cloudbase';
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
}

// 集合名称
const COLLECTION = 'places';

export const useAttractionsStore = create<AttractionsState>((set) => ({
  attractions: [],
  currentAttraction: null,
  loading: false,
  total: 0,

  fetchList: async ({ page, pageSize, keyword, category, location }) => {
    set({ loading: true });

    try {
      await initCloudBase();
      const db = getDb();

      // 构建查询条件
      const whereCond: Record<string, unknown> = {};

      if (keyword) {
        whereCond.name = db.RegExp({
          regexp: keyword,
          options: 'i',
        });
      }

      if (category && category !== 'all') {
        whereCond.category = category;
      }

      if (location && location !== 'all') {
        whereCond.location = location;
      }

      // 查询数据
      const query = db.collection(COLLECTION).where(whereCond);

      // 获取总数
      const countResult = await query.count();
      const total = countResult.total;

      // 分页查询
      const result = await db
        .collection(COLLECTION)
        .where(whereCond)
        .orderBy('createdAt', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();

      const list = (result.data || []) as Attraction[];

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
      await initCloudBase();
      const db = getDb();

      const result = await db.collection(COLLECTION).doc(id).get();
      const data = (Array.isArray(result.data) ? result.data[0] : result.data) as Attraction | null;

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
      await initCloudBase();
      const db = getDb();

      const newPlace = {
        ...data,
        wantCount: 0,
        visitCount: 0,
        tripCount: 0,
        createdAt: Date.now(),
      };

      await db.collection(COLLECTION).add(newPlace);

      return { success: true, message: '添加成功' };
    } catch (error) {
      console.error('Create attraction error:', error);
      return { success: false, message: '添加失败，请重试' };
    }
  },

  update: async (id: string, data: Partial<Attraction>) => {
    try {
      await initCloudBase();
      const db = getDb();

      await db.collection(COLLECTION).doc(id).update(data);

      return { success: true, message: '更新成功' };
    } catch (error) {
      console.error('Update attraction error:', error);
      return { success: false, message: '更新失败，请重试' };
    }
  },

  delete: async (id: string) => {
    try {
      await initCloudBase();
      const db = getDb();

      await db.collection(COLLECTION).doc(id).remove();

      return { success: true, message: '删除成功' };
    } catch (error) {
      console.error('Delete attraction error:', error);
      return { success: false, message: '删除失败，请重试' };
    }
  },
}));
