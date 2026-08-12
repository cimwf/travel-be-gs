import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { callCloudFunction } from '@/utils/cloudbase';
import type { AdminUser } from '@/types';

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (username: string, password: string, nickname: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
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
          const result = await callCloudFunction<{ success: boolean; user?: Record<string, unknown>; error?: string }>('admin/login', { username, password });
          if (result.success && result.user) {
            const user = createAdminUser({ ...result.user, _id: result.user.id });

            set({
              user,
              token: 'token-' + Date.now(),
              isAuthenticated: true,
              loading: false,
            });

            return { success: true, message: '登录成功' };
          }

          set({ loading: false });
          return { success: false, message: result.error || '用户名或密码错误' };
        } catch (error) {
          console.error('Login error:', error);
          set({ loading: false });
          return { success: false, message: '登录失败，请检查网络连接' };
        }
      },

      register: async (username: string, password: string, nickname: string) => {
        set({ loading: true });

        try {
          const result = await callCloudFunction<{ success: boolean; error?: string }>('admin/register', { username, password, nickname });
          set({ loading: false });
          return { success: result.success, message: result.success ? '注册成功，请登录' : (result.error || '注册失败') };
        } catch (error) {
          console.error('Register error:', error);
          set({ loading: false });
          return { success: false, message: '注册失败，请检查网络连接' };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
