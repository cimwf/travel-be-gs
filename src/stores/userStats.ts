import { create } from 'zustand';
import { getDb, initCloudBase } from '@/utils/cloudbase';

export interface UserStatItem {
  _id: string;
  type: 'loginPageVisit' | 'loginSuccess' | 'registerPageVisit' | 'registerSuccess' | 'activeUser';
  date: string;
  count: number;
  openids: string[];
  updatedAt: number;
}

export interface DailyStat {
  date: string;
  count: number;
}

interface FunnelData {
  loginPageVisit: number;
  loginSuccess: number;
  registerPageVisit: number;
  registerSuccess: number;
  activeUser: number;
}

interface UserStatsState {
  // 今日数据
  todayFunnel: FunnelData;

  // 转化率
  loginRate: number;        // 登录转化率
  registerRate: number;     // 注册转化率
  overallRate: number;      // 整体转化率

  // 汇总数据
  totalActiveUsers: number;
  todayActiveUsers: number;
  weekActiveUsers: number;
  monthActiveUsers: number;

  // 趋势数据
  activeTrend: DailyStat[];
  registerTrend: DailyStat[];

  loading: boolean;

  fetchStats: () => Promise<void>;
  fetchTrend: (days?: number) => Promise<void>;
}

const COLLECTION = 'user_stats';

// 获取今天的日期
const getToday = () => new Date().toISOString().split('T')[0];

// 获取日期范围
const getDateRange = (days: number) => {
  const dates: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

export const useUserStatsStore = create<UserStatsState>((set) => ({
  todayFunnel: {
    loginPageVisit: 0,
    loginSuccess: 0,
    registerPageVisit: 0,
    registerSuccess: 0,
    activeUser: 0,
  },
  loginRate: 0,
  registerRate: 0,
  overallRate: 0,
  totalActiveUsers: 0,
  todayActiveUsers: 0,
  weekActiveUsers: 0,
  monthActiveUsers: 0,
  activeTrend: [],
  registerTrend: [],
  loading: false,

  fetchStats: async () => {
    set({ loading: true });

    try {
      await initCloudBase();
      const db = getDb();

      const today = getToday();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const monthAgoStr = monthAgo.toISOString().split('T')[0];

      // 获取所有数据
      const result = await db
        .collection(COLLECTION)
        .limit(2000)
        .get();

      const list = (result.data || []) as UserStatItem[];

      // 今日漏斗数据
      const todayData = list.filter((item) => item.date === today);
      const todayFunnel: FunnelData = {
        loginPageVisit: 0,
        loginSuccess: 0,
        registerPageVisit: 0,
        registerSuccess: 0,
        activeUser: 0,
      };

      todayData.forEach((item) => {
        todayFunnel[item.type] = item.count || 0;
      });

      // 计算转化率
      const loginRate = todayFunnel.loginPageVisit > 0
        ? Math.round((todayFunnel.loginSuccess / todayFunnel.loginPageVisit) * 100)
        : 0;
      const registerRate = todayFunnel.registerPageVisit > 0
        ? Math.round((todayFunnel.registerSuccess / todayFunnel.registerPageVisit) * 100)
        : 0;
      const overallRate = todayFunnel.loginPageVisit > 0
        ? Math.round((todayFunnel.registerSuccess / todayFunnel.loginPageVisit) * 100)
        : 0;

      // 计算日活汇总
      let totalActiveUsers = 0;
      let todayActiveUsers = 0;
      let weekActiveUsers = 0;
      let monthActiveUsers = 0;

      list.forEach((item) => {
        if (item.type === 'activeUser') {
          totalActiveUsers += item.count || 0;

          if (item.date === today) {
            todayActiveUsers = item.count || 0;
          }

          if (item.date >= weekAgoStr) {
            weekActiveUsers += item.count || 0;
          }

          if (item.date >= monthAgoStr) {
            monthActiveUsers += item.count || 0;
          }
        }
      });

      set({
        todayFunnel,
        loginRate,
        registerRate,
        overallRate,
        totalActiveUsers,
        todayActiveUsers,
        weekActiveUsers,
        monthActiveUsers,
        loading: false,
      });
    } catch (error) {
      console.error('Fetch user stats error:', error);
      set({ loading: false });
    }
  },

  fetchTrend: async (days = 7) => {
    set({ loading: true });

    try {
      await initCloudBase();
      const db = getDb();

      const dates = getDateRange(days);
      const startDate = dates[0];

      const result = await db
        .collection(COLLECTION)
        .where({
          date: db.command.gte(startDate),
        })
        .get();

      const list = (result.data || []) as UserStatItem[];

      // 按日期聚合
      const activeMap: Record<string, number> = {};
      const registerMap: Record<string, number> = {};

      dates.forEach((d) => {
        activeMap[d] = 0;
        registerMap[d] = 0;
      });

      list.forEach((item) => {
        if (activeMap[item.date] !== undefined) {
          if (item.type === 'activeUser') {
            activeMap[item.date] += item.count || 0;
          }
          if (item.type === 'registerSuccess') {
            registerMap[item.date] += item.count || 0;
          }
        }
      });

      const activeTrend = dates.map((date) => ({
        date: `${new Date(date).getMonth() + 1}/${new Date(date).getDate()}`,
        count: activeMap[date],
      }));

      const registerTrend = dates.map((date) => ({
        date: `${new Date(date).getMonth() + 1}/${new Date(date).getDate()}`,
        count: registerMap[date],
      }));

      set({ activeTrend, registerTrend, loading: false });
    } catch (error) {
      console.error('Fetch user trend error:', error);
      set({ loading: false });
    }
  },
}));
