import { create } from 'zustand';
import { callCloudFunction } from '@/utils/cloudbase';

export type MachineSuggest = 'pass' | 'review' | 'risky';
export type AdminReviewStatus = 'not_required' | 'pending' | 'approved' | 'rejected';
export type ReviewFilterStatus = Exclude<AdminReviewStatus, 'not_required'>;

export interface CommunityReviewImage {
  url?: string;
  key?: string;
  width?: number;
  height?: number;
}

export interface CommunityReviewPost {
  _id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  images: Array<CommunityReviewImage | string>;
  imageCount: number;
  location?: { name?: string; address?: string } | null;
  machineSuggest: MachineSuggest;
  adminReviewStatus: AdminReviewStatus;
  reviewStatus: 'approved' | 'manual_review' | 'rejected';
  adminReviewRemark?: string;
  adminReviewedAt?: number;
  adminReviewerName?: string;
  createdAt: number;
  updatedAt: number;
  status: string;
}

interface FetchParams {
  adminId: string;
  page: number;
  pageSize: number;
  reviewStatus: ReviewFilterStatus;
  machineSuggest: 'all' | MachineSuggest;
}

interface ReviewResult {
  success: boolean;
  message: string;
}

interface ReviewListResponse {
  success: boolean;
  posts?: CommunityReviewPost[];
  total?: number;
  page?: number;
  pageSize?: number;
  error?: string;
}

interface ReviewUpdateResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface CommunityReviewState {
  posts: CommunityReviewPost[];
  total: number;
  loading: boolean;
  error: string;
  fetchList: (params: FetchParams) => Promise<void>;
  review: (
    adminId: string,
    post: CommunityReviewPost,
    decision: 'approved' | 'rejected',
    remark: string,
    reviewerName: string,
  ) => Promise<ReviewResult>;
}

export const useCommunityReviewStore = create<CommunityReviewState>((set) => ({
  posts: [],
  total: 0,
  loading: false,
  error: '',

  fetchList: async (params) => {
    set({ loading: true, error: '' });
    try {
      const result = await callCloudFunction<ReviewListResponse>('admin/communityReviewList', { ...params });
      if (!result.success) {
        throw new Error(result.error || '审核列表加载失败');
      }
      set({
        posts: result.posts || [],
        total: result.total || 0,
        loading: false,
        error: '',
      });
    } catch (error) {
      console.error('Fetch community reviews error:', error);
      const message = error instanceof Error ? error.message : '审核列表加载失败，请重试';
      set({ posts: [], total: 0, loading: false, error: message });
    }
  },

  review: async (adminId, post, decision, remark, reviewerName) => {
    try {
      const result = await callCloudFunction<ReviewUpdateResponse>('admin/communityReviewUpdate', {
        adminId,
        postId: post._id,
        decision,
        remark,
        reviewerName,
      });
      return {
        success: result.success,
        message: result.message || result.error || (result.success ? '审核成功' : '审核操作失败，请重试'),
      };
    } catch (error) {
      console.error('Review community post error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '审核操作失败，请重试',
      };
    }
  },
}));
