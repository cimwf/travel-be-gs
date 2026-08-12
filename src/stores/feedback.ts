import { create } from 'zustand';
import { adminDelete, adminList, adminUpdate } from '@/utils/adminApi';

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
  delete: (id: string) => Promise<{ success: boolean; message: string }>;
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  feedbacks: [],
  loading: false,
  total: 0,

  fetchList: async ({ page, pageSize, status }) => {
    set({ loading: true });

    try {
      const result = await adminList<FeedbackItem>('feedbacks', { page, pageSize, filters: { status }, cloudFields: ['userInfo.avatar'] });
      if (!result.success) throw new Error(result.error);
      const list = result.items || [];
      const total = result.total || 0;

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
      const result = await adminUpdate('feedbacks', id, { status });
      if (!result.success) throw new Error(result.error);

      return { success: true, message: '状态更新成功' };
    } catch (error) {
      console.error('Update feedback status error:', error);
      return { success: false, message: '状态更新失败' };
    }
  },

  delete: async (id: string) => {
    try {
      const result = await adminDelete('feedbacks', id);
      if (!result.success) throw new Error(result.error);

      return { success: true, message: '删除成功' };
    } catch (error) {
      console.error('Delete feedback error:', error);
      return { success: false, message: '删除失败' };
    }
  },
}));
