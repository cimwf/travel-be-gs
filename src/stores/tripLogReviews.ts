import { create } from 'zustand';
import { callCloudFunction } from '@/utils/cloudbase';

export type MachineSuggest = 'pass' | 'review' | 'risky';
export type ReviewStatus = 'approved' | 'rejected';
export type AdminReviewStatus = 'not_required' | 'pending' | ReviewStatus;

export interface TripLogReviewItem {
  _id: string;
  tripId: string;
  placeName?: string;
  publisherId: string;
  publisherName?: string;
  publisherAvatar?: string;
  content?: string;
  images?: Array<{ url?: string; key?: string } | string>;
  location?: { name?: string; address?: string } | null;
  weatherLabel?: string;
  machineSuggest: MachineSuggest;
  adminReviewStatus: AdminReviewStatus;
  reviewStatus: 'reviewing' | 'manual_review' | ReviewStatus;
  adminReviewRemark?: string;
  adminReviewedAt?: number;
  adminReviewerName?: string;
  createdAt: number;
}

interface State {
  logs: TripLogReviewItem[];
  total: number;
  loading: boolean;
  error: string;
  fetchList: (params: Record<string, unknown>) => Promise<void>;
  review: (params: Record<string, unknown>) => Promise<{ success: boolean; message: string }>;
}

export const useTripLogReviewStore = create<State>((set) => ({
  logs: [], total: 0, loading: false, error: '',
  fetchList: async (params) => {
    set({ loading: true, error: '' });
    try {
      const result = await callCloudFunction<{ success: boolean; logs?: TripLogReviewItem[]; total?: number; error?: string }>(
        'admin/tripLogReviewList', params,
      );
      if (!result.success) throw new Error(result.error || '旅行记录审核列表加载失败');
      set({ logs: result.logs || [], total: result.total || 0, loading: false, error: '' });
    } catch (error) {
      set({ logs: [], total: 0, loading: false, error: error instanceof Error ? error.message : '加载失败' });
    }
  },
  review: async (params) => {
    try {
      const result = await callCloudFunction<{ success: boolean; message?: string; error?: string }>(
        'admin/tripLogReviewUpdate', params,
      );
      return { success: result.success, message: result.message || result.error || '操作完成' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : '审核操作失败' };
    }
  },
}));
