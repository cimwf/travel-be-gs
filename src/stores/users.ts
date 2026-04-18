import { create } from 'zustand';
import { getDb, initCloudBase } from '@/utils/cloudbase';
import app from '@/utils/cloudbase';

export interface UserItem {
  _id: string;
  openid: string;
  phone: string;
  phoneMask: string;
  nickname: string;
  avatar: string;
  gender: string;
  bio: string;
  following: number;
  followers: number;
  trips: number;
  places: number;
  tags: string[];
  carOwner: boolean;
  createdAt: number;
  lastActiveAt: number;
  background: string;
  photos: string[];
}

interface UsersState {
  users: UserItem[];
  loading: boolean;
  total: number;

  fetchList: (params: {
    page: number;
    pageSize: number;
    keyword?: string;
  }) => Promise<void>;
}

const COLLECTION = 'users';

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  loading: false,
  total: 0,

  fetchList: async ({ page, pageSize, keyword }) => {
    set({ loading: true });

    try {
      await initCloudBase();
      const db = getDb();

      const whereCond: Record<string, unknown> = {};
      if (keyword) {
        whereCond.nickname = db.RegExp({
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

      const list = (result.data || []) as UserItem[];

      // 转换云存储链接
      const cloudUrls: string[] = [];
      list.forEach((item) => {
        if (item.avatar?.startsWith('cloud://')) {
          cloudUrls.push(item.avatar);
        }
        if (item.background?.startsWith('cloud://')) {
          cloudUrls.push(item.background);
        }
      });

      // 批量获取临时链接
      if (cloudUrls.length > 0) {
        try {
          const urlResult = await app.getTempFileURL({
            fileList: cloudUrls,
          });

          if (urlResult.fileList) {
            const urlMap: Record<string, string> = {};
            urlResult.fileList.forEach((item: { fileid: string; tempFileURL: string }) => {
              urlMap[item.fileid] = item.tempFileURL;
            });

            // 更新链接
            list.forEach((item) => {
              if (item.avatar && urlMap[item.avatar]) {
                item.avatar = urlMap[item.avatar];
              }
              if (item.background && urlMap[item.background]) {
                item.background = urlMap[item.background];
              }
            });
          }
        } catch (error) {
          console.error('Get temp URL error:', error);
        }
      }

      set({
        users: list,
        total,
        loading: false,
      });
    } catch (error) {
      console.error('Fetch users error:', error);
      set({ users: [], total: 0, loading: false });
    }
  },
}));
