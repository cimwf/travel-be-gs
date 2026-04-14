import { create } from 'zustand';
import type { Attraction, PaginatedResponse } from '@/types';
import { mockAttractions } from '@/mock/attractions';

interface AttractionsState {
  attractions: Attraction[];
  currentAttraction: Attraction | null;
  loading: boolean;
  total: number;

  fetchList: (params: {
    page: number;
    pageSize: number;
    keyword?: string;
    category?: string;
    location?: string;
  }) => Promise<PaginatedResponse<Attraction>>;

  fetchById: (id: string) => Promise<Attraction | null>;
  create: (data: Partial<Attraction>) => Promise<boolean>;
  update: (id: string, data: Partial<Attraction>) => Promise<boolean>;
  delete: (id: string) => Promise<boolean>;
}

export const useAttractionsStore = create<AttractionsState>(() => ({
  attractions: [],
  currentAttraction: null,
  loading: false,
  total: 0,

  fetchList: async ({ page, pageSize, keyword, category, location }) => {
    // 模拟 API 延迟
    await new Promise((resolve) => setTimeout(resolve, 300));

    let filtered = [...mockAttractions];

    if (keyword) {
      filtered = filtered.filter((a) =>
        a.name.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    if (category && category !== 'all') {
      filtered = filtered.filter((a) => a.category === category);
    }

    if (location && location !== 'all') {
      filtered = filtered.filter((a) => a.location === location);
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize);

    return { list, total, page, pageSize };
  },

  fetchById: async (id: string) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockAttractions.find((a) => a._id === id) || null;
  },

  create: async (data: Partial<Attraction>) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const newAttraction: Attraction = {
      _id: String(Date.now()),
      name: data.name || '',
      category: data.category || '',
      tags: data.tags || [],
      location: data.location || '',
      distance: data.distance || 0,
      description: data.description || '',
      coverImage: data.coverImage || '',
      images: data.images || [],
      wantCount: 0,
      visitCount: 0,
      tripCount: 0,
      difficulty: data.difficulty || '简单',
      bestSeason: data.bestSeason || '',
      duration: data.duration || '',
      altitude: data.altitude,
      openTime: data.openTime || '',
      tipsList: data.tipsList || [],
      createdAt: Date.now(),
    };

    mockAttractions.unshift(newAttraction);
    return true;
  },

  update: async (id: string, data: Partial<Attraction>) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const index = mockAttractions.findIndex((a) => a._id === id);
    if (index !== -1) {
      mockAttractions[index] = {
        ...mockAttractions[index],
        ...data,
      };
      return true;
    }
    return false;
  },

  delete: async (id: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const index = mockAttractions.findIndex((a) => a._id === id);
    if (index !== -1) {
      mockAttractions.splice(index, 1);
      return true;
    }
    return false;
  },
}));
