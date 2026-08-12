import { create } from 'zustand';
import { adminCall, adminDelete, adminList, adminUpdate } from '@/utils/adminApi';

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

export const useUserSpotsStore = create<UserSpotsState>((set) => ({
  spots: [],
  loading: false,
  total: 0,

  fetchList: async ({ page, pageSize, keyword }) => {
    set({ loading: true });

    try {
      const result = await adminList<UserSpot>('userSpots', { page, pageSize, keyword, cloudFields: ['coverImage'] });
      if (!result.success) throw new Error(result.error);
      const list = result.items || [];
      const total = result.total || 0;

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
      const result = await adminUpdate('userSpots', id, { status: 'approved' });
      if (!result.success) throw new Error(result.error);

      return { success: true, message: '已审核通过' };
    } catch (error) {
      console.error('Approve user spot error:', error);
      return { success: false, message: '操作失败' };
    }
  },

  delete: async (id: string) => {
    try {
      const result = await adminDelete('userSpots', id);
      if (!result.success) throw new Error(result.error);

      return { success: true, message: '删除成功' };
    } catch (error) {
      console.error('Delete user spot error:', error);
      return { success: false, message: '删除失败' };
    }
  },

  moveToQuickAttractions: async (id: string) => {
    try {
      const result = await adminCall('admin/spotPublish', { id });
      if (!result.success) throw new Error(result.error);

      return { success: true, message: '已上线' };
    } catch (error) {
      console.error('Move to quick attractions error:', error);
      return { success: false, message: '上线失败' };
    }
  },
}));
