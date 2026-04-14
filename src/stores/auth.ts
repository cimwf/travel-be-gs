import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import md5 from 'md5';
import { getDb, initCloudBase } from '@/utils/cloudbase';
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
          // 初始化云开发（匿名登录）
          const inited = await initCloudBase();
          if (!inited) {
            set({ loading: false });
            return { success: false, message: '云开发初始化失败' };
          }

          // 密码 MD5 加密
          const passwordHash = md5(password);

          // 从云数据库查询用户
          const db = getDb();
          const result = await db
            .collection('admin_users')
            .where({
              username: username,
              password: passwordHash,
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

      register: async (username: string, password: string, nickname: string) => {
        set({ loading: true });

        try {
          // 初始化云开发（匿名登录）
          const inited = await initCloudBase();
          if (!inited) {
            set({ loading: false });
            return { success: false, message: '云开发初始化失败' };
          }

          const db = getDb();

          // 检查用户名是否已存在
          const checkResult = await db
            .collection('admin_users')
            .where({
              username: username,
            })
            .get();

          if (checkResult.data && checkResult.data.length > 0) {
            set({ loading: false });
            return { success: false, message: '用户名已存在' };
          }

          // 密码 MD5 加密
          const passwordHash = md5(password);

          // 创建用户
          await db.collection('admin_users').add({
            username,
            password: passwordHash,
            nickname: nickname || username,
            role: 'admin',
            permissions: ['*'],
            createdAt: Date.now(),
            lastLoginAt: Date.now(),
          });

          set({ loading: false });
          return { success: true, message: '注册成功，请登录' };
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
