import { create } from 'zustand';
import { adminList } from '@/utils/adminApi';

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

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  loading: false,
  total: 0,

  fetchList: async ({ page, pageSize, keyword }) => {
    set({ loading: true });

    try {
      const result = await adminList<UserItem>('users', { page, pageSize, keyword, cloudFields: ['avatar', 'background'] });
      if (!result.success) throw new Error(result.error);
      const list = result.items || [];
      const total = result.total || 0;

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
