import { create } from 'zustand';
import { getDb, initCloudBase } from '@/utils/cloudbase';

type UserStatType = 'tripListVisit' | 'loginSuccess';

export interface UserStatItem {
  _id: string;
  type: UserStatType;
  date: string;
  count: number;
  openids?: string[];
  updatedAt?: number;
}

interface FunnelData {
  tripListVisit: number;
  loginSuccess: number;
}

interface UserStatsState {
  todayFunnel: FunnelData;
  visitToLoginRate: number;
  todayVisitors: number;
  todayLoggedInUsers: number;
  todayConvertedVisitors: number;
  todayAnonymousVisitors: number;
  loading: boolean;
  fetchStats: () => Promise<void>;
}

const COLLECTION = 'user_stats';

const getToday = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

const emptyFunnel: FunnelData = {
  tripListVisit: 0,
  loginSuccess: 0,
};

const getOpenidSet = (items: UserStatItem[], type: UserStatType) => {
  const item = items.find((stat) => stat.type === type);
  return new Set((item?.openids || []).filter(Boolean));
};

export const useUserStatsStore = create<UserStatsState>((set) => ({
  todayFunnel: emptyFunnel,
  visitToLoginRate: 0,
  todayVisitors: 0,
  todayLoggedInUsers: 0,
  todayConvertedVisitors: 0,
  todayAnonymousVisitors: 0,
  loading: false,

  fetchStats: async () => {
    set({ loading: true });

    try {
      await initCloudBase();
      const db = getDb();
      const today = getToday();

      const result = await db
        .collection(COLLECTION)
        .limit(2000)
        .get();

      const todayData = ((result.data || []) as UserStatItem[])
        .filter((item) => item.date === today)
        .filter((item) => item.type === 'tripListVisit' || item.type === 'loginSuccess');

      const todayFunnel = todayData.reduce<FunnelData>((funnel, item) => {
        funnel[item.type] = item.count || 0;
        return funnel;
      }, { ...emptyFunnel });

      const visitOpenids = getOpenidSet(todayData, 'tripListVisit');
      const loginOpenids = getOpenidSet(todayData, 'loginSuccess');

      const todayVisitors = visitOpenids.size || todayFunnel.tripListVisit;
      const todayLoggedInUsers = loginOpenids.size || todayFunnel.loginSuccess;
      const todayConvertedVisitors = visitOpenids.size > 0
        ? Array.from(visitOpenids).filter((openid) => loginOpenids.has(openid)).length
        : Math.min(todayVisitors, todayLoggedInUsers);
      const todayAnonymousVisitors = visitOpenids.size > 0
        ? Array.from(visitOpenids).filter((openid) => !loginOpenids.has(openid)).length
        : Math.max(todayVisitors - todayLoggedInUsers, 0);
      const visitToLoginRate = todayVisitors > 0
        ? Math.round((todayConvertedVisitors / todayVisitors) * 100)
        : 0;

      set({
        todayFunnel,
        visitToLoginRate,
        todayVisitors,
        todayLoggedInUsers,
        todayConvertedVisitors,
        todayAnonymousVisitors,
        loading: false,
      });
    } catch (error) {
      console.error('Fetch user stats error:', error);
      set({ loading: false });
    }
  },
}));
