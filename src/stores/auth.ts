import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminUser } from '@/types';

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

// 白名单账号配置
const ADMIN_WHITELIST = [
  { username: 'admin', password: 'gs789456', nickname: '管理员', role: 'admin' as const },
];

// 用户数据模板
const createAdminUser = (username: string, nickname: string, role: 'admin' | 'operator' | 'viewer'): AdminUser => ({
  id: '1',
  username,
  nickname,
  avatar: '',
  role,
  permissions: ['*'],
  createdAt: '2026-01-01',
  lastLoginAt: new Date().toISOString(),
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        // 白名单验证
        const admin = ADMIN_WHITELIST.find(
          (item) => item.username === username && item.password === password
        );

        if (admin) {
          set({
            user: createAdminUser(admin.username, admin.nickname, admin.role),
            token: 'token-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11),
            isAuthenticated: true,
          });
          return { success: true, message: '登录成功' };
        }

        return { success: false, message: '用户名或密码错误' };
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
