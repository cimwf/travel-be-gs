import { create } from 'zustand';
import { getDb, initCloudBase } from '@/utils/cloudbase';
import app from '@/utils/cloudbase';

export interface UserSpot {
  _id?: string;
  placeName: string;
  location: string;
  coverImage: string;
  status: 'pending' | 'approved';
  creatorId?: string;
  createdAt: number;
}

interface UserSpotsState {
  spots: UserSpot[];
  loading: boolean;
  total: number;

  fetchList: (params: {
    page: number;
    pageSize: number;
    keyword?: string;
  }) => Promise<{ list: UserSpot[]; total: number }>;

  approve: (id: string) => Promise<{ success: boolean; message: string }>;
  delete: (id: string) => Promise<{ success: boolean; message: string }>;
  moveToQuickAttractions: (id: string, spot?: UserSpot) => Promise<{ success: boolean; message: string }>;
}

const COLLECTION = 'user_spots';
const QUICK_COLLECTION = 'quick_attractions';

export const useUserSpotsStore = create<UserSpotsState>((set) => ({
  spots: [],
  loading: false,
  total: 0,

  fetchList: async ({ page, pageSize, keyword }) => {
    set({ loading: true });

    try {
      await initCloudBase();
      const db = getDb();

      const whereCond: Record<string, unknown> = {};
      if (keyword) {
        whereCond.placeName = db.RegExp({
          regexp: keyword,
          options: 'i',
        });
      }

      const countResult = await db.collection(COLLECTION).where(whereCond).count();
      const total = countResult.total;

      const result = await db
        .collection(COLLECTION)
        .where(whereCond)
        .orderBy('createdAt', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();

      const list = (result.data || []) as UserSpot[];

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

      set({ spots: list, total, loading: false });

      return { list, total };
    } catch (error) {
      console.error('Fetch user spots error:', error);
      set({ loading: false, spots: [], total: 0 });
      return { list: [], total: 0 };
    }
  },

  approve: async (id: string) => {
    try {
      await initCloudBase();
      const db = getDb();

      await db.collection(COLLECTION).doc(id).update({ status: 'approved' });

      return { success: true, message: '已审核通过' };
    } catch (error) {
      console.error('Approve user spot error:', error);
      return { success: false, message: '操作失败' };
    }
  },

  delete: async (id: string) => {
    try {
      await initCloudBase();
      const db = getDb();

      await db.collection(COLLECTION).doc(id).remove();

      return { success: true, message: '删除成功' };
    } catch (error) {
      console.error('Delete user spot error:', error);
      return { success: false, message: '删除失败' };
    }
  },

  moveToQuickAttractions: async (id: string, existingSpot?: UserSpot) => {
    try {
      await initCloudBase();
      const db = getDb();

      let spot: UserSpot | undefined = existingSpot;

      if (!spot) {
        const result = await db.collection(COLLECTION).doc(id).get();
        spot = result.data as unknown as UserSpot;
      }

      if (!spot || !spot.placeName) {
        return { success: false, message: '景点数据异常，请重试' };
      }

      // 添加到 quick_attractions
      await db.collection(QUICK_COLLECTION).add({
        name: spot.placeName,
        location: spot.location || '',
        coverImage: spot.coverImage || '',
        createdAt: Date.now(),
      });

      // 标记为已审核
      await db.collection(COLLECTION).doc(id).update({ status: 'approved' });

      return { success: true, message: '已上线' };
    } catch (error) {
      console.error('Move to quick attractions error:', error);
      return { success: false, message: '上线失败' };
    }
  },
}));
