import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '@/utils/cloudbase';
import type { AdminUser } from '@/types';

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  checkAuth: () => void;
}

// 创建用户数据
const createAdminUser = (data: Record<string, unknown>): AdminUser => ({
  id: data._id as string || '',
  username: data.username as string || '',
  nickname: data.nickname as string || data.username as string || '',
  avatar: '',
  role: (data.role as 'admin' | 'operator' | 'viewer') || 'admin',
  permissions: (data.permissions as string[]) || ['*'],
  createdAt: String(data.createdAt || ''),
  lastLoginAt: String(data.lastLoginAt || ''),
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,

      login: async (username: string, password: string) => {
        set({ loading: true });

        try {
          // 从云数据库查询用户
          const result = await db
            .collection('admin_users')
            .where({
              username: username,
              password: password,
            })
            .get();

          if (result.data && result.data.length > 0) {
            const userData = result.data[0];

            // 更新最后登录时间
            await db
              .collection('admin_users')
              .doc(userData._id)
              .update({
                lastLoginAt: Date.now(),
              });

            const user = createAdminUser(userData);

            set({
              user,
              token: 'token-' + Date.now(),
              isAuthenticated: true,
              loading: false,
            });

            return { success: true, message: '登录成功' };
          }

          set({ loading: false });
          return { success: false, message: '用户名或密码错误' };
        } catch (error) {
          console.error('Login error:', error);
          set({ loading: false });
          return { success: false, message: '登录失败，请检查网络连接' };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      checkAuth: () => {
        // 检查本地存储的登录状态
        const state = useAuthStore.getState();
        if (state.token && state.user) {
          set({ isAuthenticated: true });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
