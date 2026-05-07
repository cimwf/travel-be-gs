import { create } from 'zustand';
import { getDb, initCloudBase } from '@/utils/cloudbase';
import { defaultAIImageTemplates } from '@/mock/aiImageTemplates';
import type { AIImageTemplate } from '@/types';

const COLLECTION = 'ai_image_templates';

interface AIImageTemplateState {
  templates: AIImageTemplate[];
  loading: boolean;
  total: number;

  fetchList: (params: {
    page: number;
    pageSize: number;
    mode?: 'all' | 'text' | 'image';
    keyword?: string;
  }) => Promise<{ list: AIImageTemplate[]; total: number }>;
  create: (data: Partial<AIImageTemplate>) => Promise<{ success: boolean; message: string }>;
  update: (id: string, data: Partial<AIImageTemplate>) => Promise<{ success: boolean; message: string }>;
  delete: (id: string) => Promise<{ success: boolean; message: string }>;
  toggleEnabled: (id: string, enabled: boolean) => Promise<{ success: boolean; message: string }>;
  updateSort: (id: string, sort: number) => Promise<{ success: boolean; message: string }>;
  seedDefaults: () => Promise<{ success: boolean; message: string; count: number }>;
}

function normalizeTemplate(data: Partial<AIImageTemplate>) {
  return {
    templateId: data.templateId || '',
    mode: data.mode === 'image' ? 'image' : 'text',
    title: data.title || '',
    desc: data.desc || '',
    badge: data.badge || '',
    ratio: data.ratio || '1:1',
    style: data.style || '',
    prompt: data.prompt || '',
    sort: typeof data.sort === 'number' ? data.sort : 1,
    enabled: data.enabled !== false,
  };
}

export const useAIImageTemplateStore = create<AIImageTemplateState>((set, get) => ({
  templates: [],
  loading: false,
  total: 0,

  fetchList: async ({ page, pageSize, mode = 'all', keyword = '' }) => {
    set({ loading: true });

    try {
      await initCloudBase();
      const db = getDb();
      const whereCond: Record<string, unknown> = {};

      if (mode !== 'all') {
        whereCond.mode = mode;
      }

      if (keyword) {
        whereCond.title = db.RegExp({
          regexp: keyword,
          options: 'i',
        });
      }

      const query = db.collection(COLLECTION).where(whereCond);
      const countResult = await query.count();
      const result = await db
        .collection(COLLECTION)
        .where(whereCond)
        .orderBy('sort', 'asc')
        .orderBy('createdAt', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get();

      const list = (result.data || []) as AIImageTemplate[];
      const total = countResult.total || 0;

      set({ templates: list, total, loading: false });
      return { list, total };
    } catch (error) {
      console.error('Fetch AI image templates error:', error);
      set({ templates: [], total: 0, loading: false });
      return { list: [], total: 0 };
    }
  },

  create: async (data) => {
    try {
      await initCloudBase();
      const db = getDb();
      const now = Date.now();

      await db.collection(COLLECTION).add({
        ...normalizeTemplate(data),
        likeCount: 0,
        dislikeCount: 0,
        createdAt: now,
        updatedAt: now,
      });

      return { success: true, message: '创建成功' };
    } catch (error) {
      console.error('Create AI image template error:', error);
      return { success: false, message: '创建失败' };
    }
  },

  update: async (id, data) => {
    try {
      await initCloudBase();
      const db = getDb();

      await db.collection(COLLECTION).doc(id).update({
        ...normalizeTemplate(data),
        updatedAt: Date.now(),
      });

      return { success: true, message: '更新成功' };
    } catch (error) {
      console.error('Update AI image template error:', error);
      return { success: false, message: '更新失败' };
    }
  },

  delete: async (id) => {
    try {
      await initCloudBase();
      const db = getDb();

      await db.collection(COLLECTION).doc(id).remove();

      return { success: true, message: '删除成功' };
    } catch (error) {
      console.error('Delete AI image template error:', error);
      return { success: false, message: '删除失败' };
    }
  },

  toggleEnabled: async (id, enabled) => {
    try {
      await initCloudBase();
      const db = getDb();

      await db.collection(COLLECTION).doc(id).update({
        enabled,
        updatedAt: Date.now(),
      });

      set({
        templates: get().templates.map((item) => (
          item._id === id ? { ...item, enabled } : item
        )),
      });

      return { success: true, message: enabled ? '已启用' : '已禁用' };
    } catch (error) {
      console.error('Toggle AI image template error:', error);
      return { success: false, message: '操作失败' };
    }
  },

  updateSort: async (id, sort) => {
    try {
      await initCloudBase();
      const db = getDb();

      await db.collection(COLLECTION).doc(id).update({
        sort,
        updatedAt: Date.now(),
      });

      return { success: true, message: '排序更新成功' };
    } catch (error) {
      console.error('Update AI image template sort error:', error);
      return { success: false, message: '排序更新失败' };
    }
  },

  seedDefaults: async () => {
    try {
      await initCloudBase();
      const db = getDb();
      const now = Date.now();
      let count = 0;

      for (const item of defaultAIImageTemplates) {
        if (item.templateId) {
          const existed = await db.collection(COLLECTION)
            .where({ templateId: item.templateId })
            .limit(1)
            .get();

          if (existed.data && existed.data.length > 0) {
            continue;
          }
        }

        await db.collection(COLLECTION).add({
          ...item,
          likeCount: 0,
          dislikeCount: 0,
          createdAt: now,
          updatedAt: now,
        });
        count++;
      }

      return { success: true, message: `已初始化 ${count} 个模板`, count };
    } catch (error) {
      console.error('Seed AI image templates error:', error);
      return { success: false, message: '初始化模板失败', count: 0 };
    }
  },
}));
