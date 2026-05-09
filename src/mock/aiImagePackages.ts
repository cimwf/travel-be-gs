import type { AIImagePackage } from '@/types';

export const defaultAIImagePackages: Omit<AIImagePackage, '_id' | 'createdAt' | 'updatedAt'>[] = [
  {
    packageId: 'standard-50',
    title: 'AI 生图 50 张',
    desc: '适合集中测试和日常创作，支付后立即到账。',
    badge: '推荐',
    price: 19.9,
    discount: 10,
    imageCount: 50,
    sort: 10,
    enabled: true,
  },
];
