import { create } from 'zustand';
import { getDb, initCloudBase } from '@/utils/cloudbase';

export type MachineSuggest = 'review' | 'risky';
export type AdminReviewStatus = 'pending' | 'approved' | 'rejected';

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
  page: number;
  pageSize: number;
  reviewStatus: AdminReviewStatus;
  machineSuggest: 'all' | MachineSuggest;
}

interface ReviewResult {
  success: boolean;
  message: string;
}

interface CommunityReviewState {
  posts: CommunityReviewPost[];
  total: number;
  loading: boolean;
  fetchList: (params: FetchParams) => Promise<void>;
  review: (post: CommunityReviewPost, decision: 'approved' | 'rejected', remark: string, reviewerName: string) => Promise<ReviewResult>;
}

const POSTS_COLLECTION = 'community_posts';
const NOTIFICATIONS_COLLECTION = 'notifications';
let legacyBackfillDone = false;

async function backfillLegacyReviewStatus() {
  if (legacyBackfillDone) return;
  const db = getDb();
  const _ = db.command;
  try {
    await db.collection(POSTS_COLLECTION).where({
      status: 'active',
      machineSuggest: _.in(['review', 'risky']),
      adminReviewStatus: _.exists(false),
    }).update({
      adminReviewStatus: 'pending',
      updatedAt: Date.now(),
    });
    legacyBackfillDone = true;
  } catch (error) {
    console.warn('Backfill legacy community reviews failed:', error);
  }
}

function getThumbnail(post: CommunityReviewPost) {
  const first = Array.isArray(post.images) ? post.images[0] : undefined;
  return typeof first === 'string' ? first : (first?.url || '');
}

async function saveResultNotification(post: CommunityReviewPost, decision: 'approved' | 'rejected') {
  const db = getDb();
  const now = Date.now();
  const type = decision === 'approved' ? 'community_review_approved' : 'community_review_rejected';
  const sourceId = `${post._id}:admin`;
  const payload = {
    receiverId: post.authorId,
    category: 'system',
    type,
    actorId: '',
    actorName: '',
    actorAvatar: '',
    targetType: decision === 'approved' ? 'community_post' : 'my_works',
    targetId: post._id,
    sourceType: 'review',
    sourceId,
    title: decision === 'approved' ? '作品复核通过' : '作品复核未通过',
    actionText: '',
    content: decision === 'approved'
      ? '你的作品已通过人工复核并正常展示'
      : '你的作品未通过人工复核，可前往我的作品查看',
    thumbnail: getThumbnail(post),
    isRead: false,
    readAt: 0,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  const existing = await db.collection(NOTIFICATIONS_COLLECTION)
    .where({ receiverId: post.authorId, type, sourceId })
    .limit(1)
    .get();
  if (existing.data?.[0]?._id) {
    await db.collection(NOTIFICATIONS_COLLECTION).doc(existing.data[0]._id).update(payload);
  } else {
    await db.collection(NOTIFICATIONS_COLLECTION).add(payload);
  }
}

export const useCommunityReviewStore = create<CommunityReviewState>((set) => ({
  posts: [],
  total: 0,
  loading: false,

  fetchList: async ({ page, pageSize, reviewStatus, machineSuggest }) => {
    set({ loading: true });
    try {
      await initCloudBase();
      const db = getDb();
      const _ = db.command;
      await backfillLegacyReviewStatus();
      const condition: Record<string, unknown> = {
        status: 'active',
        adminReviewStatus: reviewStatus,
        machineSuggest: machineSuggest === 'all' ? _.in(['review', 'risky']) : machineSuggest,
      };
      const collection = db.collection(POSTS_COLLECTION).where(condition);
      const [countResult, listResult] = await Promise.all([
        collection.count(),
        collection.orderBy('createdAt', 'desc').skip((page - 1) * pageSize).limit(pageSize).get(),
      ]);
      set({
        posts: (listResult.data || []) as CommunityReviewPost[],
        total: countResult.total || 0,
        loading: false,
      });
    } catch (error) {
      console.error('Fetch community reviews error:', error);
      set({ posts: [], total: 0, loading: false });
    }
  },

  review: async (post, decision, remark, reviewerName) => {
    try {
      await initCloudBase();
      const now = Date.now();
      await getDb().collection(POSTS_COLLECTION).doc(post._id).update({
        reviewStatus: decision === 'approved' ? 'approved' : 'rejected',
        imageAuditStatus: decision === 'approved' ? 'approved' : 'rejected',
        adminReviewStatus: decision,
        adminReviewRemark: remark.trim(),
        adminReviewedAt: now,
        adminReviewerName: reviewerName || '管理员',
        updatedAt: now,
      });
      try {
        await saveResultNotification(post, decision);
      } catch (notificationError) {
        console.error('Save review notification error:', notificationError);
        return {
          success: true,
          message: decision === 'approved'
            ? '已审核通过，但用户通知写入失败'
            : '已审核不通过，但用户通知写入失败',
        };
      }
      return { success: true, message: decision === 'approved' ? '已审核通过' : '已审核不通过' };
    } catch (error) {
      console.error('Review community post error:', error);
      return { success: false, message: '审核操作失败，请重试' };
    }
  },
}));
