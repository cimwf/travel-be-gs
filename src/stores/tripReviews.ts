import { create } from 'zustand';
import { callCloudFunction } from '@/utils/cloudbase';

export type TripReviewStatus = 'approved' | 'rejected';
export type TripReviewFilter = 'all' | TripReviewStatus;

export interface TripMediaObject {
  provider?: string;
  key?: string;
  url?: string;
}

export interface TripReviewItem {
  _id: string;
  tripTitle?: string;
  placeName?: string;
  creatorId?: string;
  creatorName?: string;
  creatorAvatar?: string;
  departure?: string;
  date?: string;
  meetingTime?: string;
  meetingPlace?: string;
  contactPhone?: string;
  travelDesc?: string;
  remark?: string;
  status?: string;
  tripStage?: string;
  reviewStatus: TripReviewStatus;
  adminReviewRemark?: string;
  adminReviewedAt?: number;
  adminReviewerName?: string;
  customCoverImage?: string;
  customCoverImageUrl?: string;
  customCoverImageObject?: TripMediaObject | null;
  coverImages?: string[];
  coverImageUrls?: string[];
  coverImageObjects?: TripMediaObject[];
  participants?: Array<{ userId?: string; nickname?: string; avatar?: string }>;
  currentCount?: number;
  needCount?: number;
  createdAt?: number;
  dataEnv?: string;
}

interface ListResponse {
  success: boolean;
  trips?: TripReviewItem[];
  total?: number;
  error?: string;
}

interface UpdateResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface TripReviewState {
  trips: TripReviewItem[];
  total: number;
  loading: boolean;
  error: string;
  fetchList: (params: { adminId: string; page: number; pageSize: number; reviewStatus: TripReviewFilter }) => Promise<void>;
  review: (params: { adminId: string; tripId: string; decision: TripReviewStatus; remark: string; reviewerName: string }) => Promise<{ success: boolean; message: string }>;
}

export const useTripReviewStore = create<TripReviewState>((set) => ({
  trips: [],
  total: 0,
  loading: false,
  error: '',

  fetchList: async (params) => {
    set({ loading: true, error: '' });
    try {
      const result = await callCloudFunction<ListResponse>('admin/tripReviewList', { ...params });
      if (!result.success) throw new Error(result.error || '行程审核列表加载失败');
      set({ trips: result.trips || [], total: result.total || 0, loading: false, error: '' });
    } catch (error) {
      set({
        trips: [],
        total: 0,
        loading: false,
        error: error instanceof Error ? error.message : '行程审核列表加载失败',
      });
    }
  },

  review: async (params) => {
    try {
      const result = await callCloudFunction<UpdateResponse>('admin/tripReviewUpdate', { ...params });
      return {
        success: result.success,
        message: result.message || result.error || (result.success ? '操作成功' : '审核操作失败'),
      };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : '审核操作失败' };
    }
  },
}));
