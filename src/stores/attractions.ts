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
    status?: string;
  }) => Promise<PaginatedResponse<Attraction>>;

  fetchById: (id: string) => Promise<Attraction | null>;
  create: (data: Partial<Attraction>) => Promise<boolean>;
  update: (id: string, data: Partial<Attraction>) => Promise<boolean>;
  delete: (id: string) => Promise<boolean>;
}

export const useAttractionsStore = create<AttractionsState>((set, get) => ({
  attractions: [],
  currentAttraction: null,
  loading: false,
  total: 0,

  fetchList: async ({ page, pageSize, keyword, category, status }) => {
    set({ loading: true });

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

    if (status && status !== 'all') {
      filtered = filtered.filter((a) => a.status === status);
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const list = filtered.slice(start, start + pageSize);

    set({ attractions: list, total, loading: false });

    return { list, total, page, pageSize };
  },

  fetchById: async (id: string) => {
    set({ loading: true });

    await new Promise((resolve) => setTimeout(resolve, 200));

    const attraction = mockAttractions.find((a) => a.id === id) || null;
    set({ currentAttraction: attraction, loading: false });

    return attraction;
  },

  create: async (data: Partial<Attraction>) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const newAttraction: Attraction = {
      id: String(Date.now()),
      name: data.name || '',
      district: data.district || '',
      category: data.category || '',
      level: data.level || '',
      address: data.address || '',
      openTime: data.openTime || '',
      suggestedDays: data.suggestedDays || '1天',
      difficulty: data.difficulty || 'easy',
      description: data.description || '',
      playIntro: data.playIntro || '',
      locationIntro: data.locationIntro || '',
      rating: 0,
      ratingCount: 0,
      tips: data.tips || '',
      tickets: data.tickets || [],
      images: data.images || [],
      video: data.video || '',
      tags: data.tags || [],
      isRecommended: data.isRecommended || false,
      sortWeight: data.sortWeight || 0,
      status: data.status || 'pending',
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockAttractions.unshift(newAttraction);
    return true;
  },

  update: async (id: string, data: Partial<Attraction>) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const index = mockAttractions.findIndex((a) => a.id === id);
    if (index !== -1) {
      mockAttractions[index] = {
        ...mockAttractions[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      return true;
    }
    return false;
  },

  delete: async (id: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const index = mockAttractions.findIndex((a) => a.id === id);
    if (index !== -1) {
      mockAttractions.splice(index, 1);
      return true;
    }
    return false;
  },
}));
