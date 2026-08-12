import { create } from 'zustand';
import { callCloudFunction } from '@/utils/cloudbase';

export type ReportStatus = 'pending' | 'processed' | 'ignored';
export type ReportTargetType = 'community_post' | 'trip_log';

export interface ReportImage { url?: string; key?: string }
export interface ReportTarget {
  _id: string;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  publisherId?: string;
  publisherName?: string;
  publisherAvatar?: string;
  tripId?: string;
  placeName?: string;
  content?: string;
  images?: Array<ReportImage | string>;
  location?: { name?: string; address?: string } | null;
  machineSuggest?: 'pass' | 'review' | 'risky';
  adminReviewStatus?: 'not_required' | 'pending' | 'approved' | 'rejected';
  reviewStatus?: 'reviewing' | 'manual_review' | 'approved' | 'rejected';
  status?: string;
  createdAt?: number;
}

export interface ReportItem {
  _id: string;
  reporterId: string;
  reporterName?: string;
  reporterAvatar?: string;
  targetType: ReportTargetType;
  targetId: string;
  targetAuthorId?: string;
  targetAuthorName?: string;
  targetAuthorAvatar?: string;
  reason: string;
  description?: string;
  images?: ReportImage[];
  status: ReportStatus;
  target?: ReportTarget | null;
  handleRemark?: string;
  handledByName?: string;
  handledAt?: number;
  createdAt: number;
}

interface State {
  reports: ReportItem[];
  total: number;
  loading: boolean;
  error: string;
  fetchList: (params: Record<string, unknown>) => Promise<void>;
  update: (params: Record<string, unknown>) => Promise<{ success: boolean; message: string }>;
}

export const useReportStore = create<State>((set) => ({
  reports: [], total: 0, loading: false, error: '',
  fetchList: async (params) => {
    set({ loading: true, error: '' });
    try {
      const result = await callCloudFunction<{ success: boolean; reports?: ReportItem[]; total?: number; error?: string }>('admin/reportList', params);
      if (!result.success) throw new Error(result.error || '举报列表加载失败');
      set({ reports: result.reports || [], total: result.total || 0, loading: false, error: '' });
    } catch (error) {
      set({ reports: [], total: 0, loading: false, error: error instanceof Error ? error.message : '举报列表加载失败' });
    }
  },
  update: async (params) => {
    try {
      const result = await callCloudFunction<{ success: boolean; message?: string; error?: string }>('admin/reportUpdate', params);
      return { success: result.success, message: result.message || result.error || '操作完成' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : '处理失败' };
    }
  },
}));
