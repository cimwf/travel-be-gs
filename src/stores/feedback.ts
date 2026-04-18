import { create } from 'zustand';
import { getDb, initCloudBase } from '@/utils/cloudbase';
import app from '@/utils/cloudbase';

export interface FeedbackItem {
  _id: string;
  title: string;
  content: string;
  contact: string;
  userId: string;
  userInfo?: {
    nickname: string;
    avatar: string;
    phone?: string;
  };
  status: 'pending' | 'processing' | 'resolved';
  createdAt: number;
}

interface FeedbackState {
  feedbacks: FeedbackItem[];
  loading: boolean;
  total: number;

  fetchList: (params: {
    page: number;
    pageSize: number;
    status?: string;
  }) => Promise<void>;

  updateStatus: (id: string, status: string) => Promise<{ success: boolean; message: string }>;
}

const COLLECTION = 'feedbacks';

// 获取云存储文件的临时链接
const getTempUrl = async (fileID: string): Promise<string> => {
  if (!fileID || !fileID.startsWith('cloud://')) {
    return fileID;
  }

  try {
    const result = await app.getTempFileURL({
      fileList: [fileID],
    });

    if (result.fileList && result.fileList[0] && result.fileList[0].tempFileURL) {
      return result.fileList[0].tempFileURL;
    }
  } catch (error) {
    console.error('Get temp URL error:', error);
  }

  return fileID;
};

export const useFeedbackStore = create<FeedbackState>((set) => ({
  feedbacks: [],
  loading: false,
  total: 0,

  fetchList: async ({ page, pageSize, status }) => {
    set({ loading: true });

    try {
      await initCloudBase();
      const db = getDb();

      const whereCond: Record<string, unknown> = {};
      if (status && status !== 'all') {
        whereCond.status = status;
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

      const list = (result.data || []) as FeedbackItem[];

      // 转换头像链接
      const avatarList: string[] = [];
      list.forEach((item) => {
        if (item.userInfo?.avatar?.startsWith('cloud://')) {
          avatarList.push(item.userInfo.avatar);
        }
      });

      // 批量获取临时链接
      if (avatarList.length > 0) {
        try {
          const urlResult = await app.getTempFileURL({
            fileList: avatarList,
          });

          if (urlResult.fileList) {
            const urlMap: Record<string, string> = {};
            urlResult.fileList.forEach((item: { fileid: string; tempFileURL: string }) => {
              urlMap[item.fileid] = item.tempFileURL;
            });

            // 更新头像链接
            list.forEach((item) => {
              if (item.userInfo?.avatar && urlMap[item.userInfo.avatar]) {
                item.userInfo.avatar = urlMap[item.userInfo.avatar];
              }
            });
          }
        } catch (error) {
          console.error('Batch get temp URL error:', error);
        }
      }

      set({
        feedbacks: list,
        total,
        loading: false,
      });
    } catch (error) {
      console.error('Fetch feedbacks error:', error);
      set({ feedbacks: [], total: 0, loading: false });
    }
  },

  updateStatus: async (id: string, status: string) => {
    try {
      await initCloudBase();
      const db = getDb();

      await db.collection(COLLECTION).doc(id).update({
        status,
      });

      return { success: true, message: '状态更新成功' };
    } catch (error) {
      console.error('Update feedback status error:', error);
      return { success: false, message: '状态更新失败' };
    }
  },
}));
