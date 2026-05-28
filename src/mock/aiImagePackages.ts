import type { AIImagePackage } from '@/types';

export const defaultAIImagePackages: Omit<AIImagePackage, '_id' | 'createdAt' | 'updatedAt'>[] = [
  {
    packageId: 'standard-20',
    productId: 'image_credits_20',
    title: 'AI 生图 20 张',
    desc: '适合集中测试和日常创作，支付后立即到账。',
    badge: '推荐',
    price: 9.9,
    discount: 10,
    imageCount: 20,
    sort: 10,
    enabled: true,
  },
];
