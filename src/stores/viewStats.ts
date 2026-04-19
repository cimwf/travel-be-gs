import { create } from 'zustand';
import { getDb, initCloudBase } from '@/utils/cloudbase';

export interface ViewStatItem {
  _id: string;
  placeId: string;
  placeName: string;
  date: string;
  count: number;
  createdAt: number;
  updatedAt: number;
}

export interface DailyStat {
  date: string;
  count: number;
}

export interface PlaceStat {
  placeId: string;
  placeName: string;
  totalCount: number;
}

interface ViewStatsState {
  // 汇总数据
  totalViews: number;
  todayViews: number;
  weekViews: number;
  monthViews: number;

  // 趋势数据
  dailyTrend: DailyStat[];
  weeklyTrend: DailyStat[];

  // 地点排行
  topPlaces: PlaceStat[];

  loading: boolean;

  fetchStats: (days?: number) => Promise<void>;
  fetchTrend: (type: 'daily' | 'weekly', days?: number) => Promise<void>;
  fetchTopPlaces: (limit?: number) => Promise<void>;
}

const COLLECTION = 'place_view_stats';

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

// 获取周的起始和结束日期
const getWeekRange = (weeksAgo: number) => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() - weeksAgo * 7);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  return {
    start: startOfWeek.toISOString().split('T')[0],
    end: endOfWeek.toISOString().split('T')[0],
  };
};

export const useViewStatsStore = create<ViewStatsState>((set) => ({
  totalViews: 0,
  todayViews: 0,
  weekViews: 0,
  monthViews: 0,
  dailyTrend: [],
  weeklyTrend: [],
  topPlaces: [],
  loading: false,

  fetchStats: async (days = 30) => {
    set({ loading: true });

    try {
      await initCloudBase();
      const db = getDb();

      const today = new Date().toISOString().split('T')[0];
      const dates = getDateRange(days);

      // 获取所有数据（简化查询）
      const result = await db
        .collection(COLLECTION)
        .orderBy('date', 'desc')
        .limit(1000)
        .get();

      const list = (result.data || []) as ViewStatItem[];

      // 计算总浏览量
      let totalViews = 0;
      let todayViews = 0;
      let weekViews = 0;
      let monthViews = 0;

      const todayDate = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const monthAgoStr = monthAgo.toISOString().split('T')[0];

      list.forEach((item) => {
        totalViews += item.count || 0;

        if (item.date === todayDate) {
          todayViews += item.count || 0;
        }

        if (item.date >= weekAgoStr) {
          weekViews += item.count || 0;
        }

        if (item.date >= monthAgoStr) {
          monthViews += item.count || 0;
        }
      });

      set({
        totalViews,
        todayViews,
        weekViews,
        monthViews,
        loading: false,
      });
    } catch (error) {
      console.error('Fetch view stats error:', error);
      set({ loading: false });
    }
  },

  fetchTrend: async (type, days = 7) => {
    set({ loading: true });

    try {
      await initCloudBase();
      const db = getDb();

      if (type === 'daily') {
        const dates = getDateRange(days);

        // 获取最近N天的数据
        const startDate = dates[0];
        const result = await db
          .collection(COLLECTION)
          .where({
            date: db.command.gte(startDate),
          })
          .get();

        const list = (result.data || []) as ViewStatItem[];

        // 按日期聚合
        const dateMap: Record<string, number> = {};
        dates.forEach((d) => {
          dateMap[d] = 0;
        });

        list.forEach((item) => {
          if (dateMap[item.date] !== undefined) {
            dateMap[item.date] += item.count || 0;
          }
        });

        const dailyTrend = dates.map((date) => ({
          date: `${new Date(date).getMonth() + 1}/${new Date(date).getDate()}`,
          count: dateMap[date],
        }));

        set({ dailyTrend, loading: false });
      } else {
        // 周趋势 - 获取最近8周
        const weeklyData: { date: string; count: number }[] = [];

        for (let i = 7; i >= 0; i--) {
          const { start, end } = getWeekRange(i);

          const result = await db
            .collection(COLLECTION)
            .where({
              date: db.command.gte(start).and(db.command.lte(end)),
            })
            .get();

          const list = (result.data || []) as ViewStatItem[];
          const weekCount = list.reduce((sum, item) => sum + (item.count || 0), 0);

          weeklyData.push({
            date: `${start.slice(5)}~${end.slice(5)}`,
            count: weekCount,
          });
        }

        set({ weeklyTrend: weeklyData, loading: false });
      }
    } catch (error) {
      console.error('Fetch trend error:', error);
      set({ loading: false });
    }
  },

  fetchTopPlaces: async (limit = 10) => {
    set({ loading: true });

    try {
      await initCloudBase();
      const db = getDb();

      // 获取最近30天的数据
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const startDate = monthAgo.toISOString().split('T')[0];

      const result = await db
        .collection(COLLECTION)
        .where({
          date: db.command.gte(startDate),
        })
        .get();

      const list = (result.data || []) as ViewStatItem[];

      // 按地点聚合
      const placeMap: Record<string, { placeName: string; count: number }> = {};

      list.forEach((item) => {
        if (!placeMap[item.placeId]) {
          placeMap[item.placeId] = {
            placeName: item.placeName || '未知地点',
            count: 0,
          };
        }
        placeMap[item.placeId].count += item.count || 0;
      });

      // 排序取前N个
      const topPlaces = Object.entries(placeMap)
        .map(([placeId, data]) => ({
          placeId,
          placeName: data.placeName,
          totalCount: data.count,
        }))
        .sort((a, b) => b.totalCount - a.totalCount)
        .slice(0, limit);

      set({ topPlaces, loading: false });
    } catch (error) {
      console.error('Fetch top places error:', error);
      set({ loading: false });
    }
  },
}));
