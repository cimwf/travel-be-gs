import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminUser } from '@/types';

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// 模拟用户数据
const mockAdmin: AdminUser = {
  id: '1',
  username: 'admin',
  nickname: '陈经理',
  avatar: '',
  role: 'admin',
  permissions: ['*'],
  createdAt: '2026-01-01',
  lastLoginAt: '2026-04-02',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        // 开发阶段：任意非空用户名密码均可登录
        if (username && password) {
          set({
            user: {
              ...mockAdmin,
              username,
              nickname: username,
            },
            token: 'mock-token-' + Date.now(),
            isAuthenticated: true,
          });
          return true;
        }
        return false;
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
