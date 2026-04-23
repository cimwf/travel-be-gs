import { create } from 'zustand';
import { getDb, initCloudBase } from '@/utils/cloudbase';

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
  delete: (id: string) => Promise<{ success: boolean; message: string }>;
  moveToAttractions: (id: string) => Promise<{ success: boolean; message: string }>;
}

const COLLECTION = 'quick_attractions';
const PLACES_COLLECTION = 'places';

export const useQuickAttractionsStore = create<QuickAttractionsState>((set, get) => ({
  attractions: [],
  loading: false,
  total: 0,

  fetchList: async ({ page, pageSize, keyword }) => {
    set({ loading: true });

    try {
      await initCloudBase();
      const db = getDb();

      const whereCond: Record<string, unknown> = {};
      if (keyword) {
        whereCond.name = db.RegExp({
          regexp: keyword,
          options: 'i',
        });
      }

      // 获取总数
      const countResult = await db.collection(COLLECTION).where(whereCond).count();
      const total = countResult.total;

      // 分页查询
      const result = await db
        .collection(COLLECTION)
        .where(whereCond)
        .orderBy('createdAt', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();

      const list = (result.data || []) as QuickAttraction[];

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
      await initCloudBase();
      const db = getDb();

      const newAttraction = {
        ...data,
        createdAt: Date.now(),
      };

      await db.collection(COLLECTION).add(newAttraction);

      return { success: true, message: '添加成功' };
    } catch (error) {
      console.error('Create quick attraction error:', error);
      return { success: false, message: '添加失败，请重试' };
    }
  },

  batchCreate: async (items) => {
    try {
      await initCloudBase();
      const db = getDb();

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

      // 批量插入
      for (const data of dataToInsert) {
        await db.collection(COLLECTION).add(data);
      }

      return { success: true, message: `成功添加 ${dataToInsert.length} 条景点` };
    } catch (error) {
      console.error('Batch create quick attractions error:', error);
      return { success: false, message: '批量添加失败，请重试' };
    }
  },

  delete: async (id: string) => {
    try {
      await initCloudBase();
      const db = getDb();

      await db.collection(COLLECTION).doc(id).remove();

      return { success: true, message: '删除成功' };
    } catch (error) {
      console.error('Delete quick attraction error:', error);
      return { success: false, message: '删除失败' };
    }
  },

  moveToAttractions: async (id: string) => {
    try {
      await initCloudBase();
      const db = getDb();

      // 获取快速添加的景点
      const result = await db.collection(COLLECTION).doc(id).get();
      const quickData = result.data as QuickAttraction;

      if (!quickData) {
        return { success: false, message: '景点不存在' };
      }

      // 添加到正式景点表
      await db.collection(PLACES_COLLECTION).add({
        name: quickData.name,
        location: quickData.location,
        coverImage: quickData.coverImage,
        // 默认值
        category: 'other',
        distance: 0,
        difficulty: '简单',
        duration: '半天',
        bestSeason: '四季',
        openTime: '全天开放',
        description: quickData.name,
        tags: [],
        tipsList: [],
        images: [],
        wantCount: 0,
        visitCount: 0,
        tripCount: 0,
        createdAt: Date.now(),
      });

      // 从快速添加表删除
      await db.collection(COLLECTION).doc(id).remove();

      return { success: true, message: '已转为正式景点' };
    } catch (error) {
      console.error('Move to attractions error:', error);
      return { success: false, message: '操作失败' };
    }
  },
}));
