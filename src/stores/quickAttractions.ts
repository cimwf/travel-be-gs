import { create } from 'zustand';
import { getDb, initCloudBase } from '@/utils/cloudbase';
import app from '@/utils/cloudbase';

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

      // 转换 cloud:// 链接为临时访问链接
      const cloudUrls = list
        .filter(item => item.coverImage?.startsWith('cloud://'))
        .map(item => item.coverImage);

      if (cloudUrls.length > 0) {
        try {
          const urlResult = await app.getTempFileURL({ fileList: cloudUrls });
          if (urlResult.fileList) {
            const urlMap: Record<string, string> = {};
            urlResult.fileList.forEach((item: { fileID: string; tempFileURL: string }) => {
              urlMap[item.fileID] = item.tempFileURL;
            });
            list.forEach(item => {
              if (item.coverImage && urlMap[item.coverImage]) {
                item.coverImage = urlMap[item.coverImage];
              }
            });
          }
        } catch (error) {
          console.error('Convert cloud URL error:', error);
        }
      }

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

  update: async (id: string, data) => {
    try {
      await initCloudBase();
      const db = getDb();

      await db.collection(COLLECTION).doc(id).update(data);

      return { success: true, message: '修改成功' };
    } catch (error) {
      console.error('Update quick attraction error:', error);
      return { success: false, message: '修改失败，请重试' };
    }
  },
}));
