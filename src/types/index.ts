// 景点相关类型
export interface Attraction {
  _id?: string;
  name: string;                    // 景点名称
  category: string;                // 分类（爬山、水上、古镇、露营等）
  tags: string[];                  // 标签
  location: string;                // 所在区域
  distance: number;                // 距离（公里）
  description: string;             // 描述
  coverImage: string;              // 封面图
  images: string[];                // 图片数组
  wantCount: number;               // 想去人数
  visitCount: number;              // 访问人数
  tripCount: number;               // 行程数
  difficulty: string;              // 难度
  difficultyDesc?: string;         // 难度描述
  bestSeason: string;              // 最佳季节
  duration: string;                // 游玩时长
  timeCostDetail?: string;         // 时间花费详情
  altitude?: string;               // 海拔（可选）
  openTime: string;                // 开放时间
  intro?: string;                  // 简介
  highlight?: string[];            // 亮点
  features?: string[];             // 特色
  suitableFor?: string[];          // 适合人群
  avoidFor?: string[];             // 不适合人群
  cost?: string;                   // 费用
  transport?: string;              // 交通
  rating?: number;                 // 评分
  tipsList: string[];              // 提示列表
  sortOrder: number;               // 排序权重（越小越靠前）
  createdAt: number;               // 创建时间戳
}

// 酒店相关类型
export interface Hotel {
  id: string;
  name: string;
  district: string;
  address: string;
  star: number;
  rating: number;
  priceMin: number;
  priceMax: number;
  images: string[];
  facilities: string[];
  status: 'online' | 'pending' | 'offline';
  createdAt: string;
}

// 订单相关类型
export interface Order {
  id: string;
  orderNo: string;
  userId: string;
  userName: string;
  type: 'ticket' | 'hotel';
  itemName: string;
  amount: number;
  status: 'pending' | 'paid' | 'completed' | 'refunded' | 'cancelled';
  createdAt: string;
  paidAt?: string;
}

// 用户反馈相关类型
export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  type: 'consult' | 'complaint' | 'suggestion';
  content: string;
  status: 'pending' | 'processing' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  reply?: string;
  createdAt: string;
  updatedAt: string;
}

// 用户相关类型
export interface User {
  id: string;
  nickname: string;
  avatar: string;
  phone: string;
  email: string;
  gender: 'male' | 'female' | 'unknown';
  birthday?: string;
  tags: string[];
  orderCount: number;
  totalSpent: number;
  createdAt: string;
  lastLoginAt: string;
}

// 管理员相关类型
export interface AdminUser {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
  role: 'admin' | 'operator' | 'viewer';
  permissions: string[];
  createdAt: string;
  lastLoginAt: string;
}

// AI 生图模板
export type AIImageTemplateScene = '人像' | '旅行' | '穿搭' | '美食' | '活动';

export interface AIImageTemplate {
  _id?: string;
  templateId?: string;
  mode: 'text' | 'image';
  scene?: AIImageTemplateScene;
  title: string;
  desc: string;
  badge: string;
  ratio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  style: string;
  prompt: string;
  sort: number;
  enabled: boolean;
  likeCount?: number;
  dislikeCount?: number;
  userVote?: 'like' | 'dislike' | '';
  createdAt?: number;
  updatedAt?: number;
}

// AI 生图套餐
export interface AIImagePackage {
  _id?: string;
  packageId?: string;
  productId?: string;
  title: string;
  desc: string;
  badge: string;
  price: number;
  discount?: number;
  imageCount: number;
  sort: number;
  enabled: boolean;
  createdAt?: number;
  updatedAt?: number;
}

// AI 生图渠道
export interface AIImageChannel {
  _id?: string;
  channelId: string;
  name: string;
  remark: string;
  enabled: boolean;
  isDefault: boolean;
  callCount: number;
  successCount: number;
  failCount: number;
  createdAt?: number;
  updatedAt?: number;
}

// AI 生图额度
export interface AIImageQuota {
  _id?: string;
  userId: string;
  appUserId?: string;
  nickname?: string;
  phone?: string;
  phoneMask?: string;
  avatar?: string;
  total: number;
  used: number;
  createdAt?: number;
  updatedAt?: number;
}

// AI 生图支付订单
export interface AIImageOrder {
  _id?: string;
  orderNo?: string;
  userId: string;
  appUserId?: string;
  nickname?: string;
  phone?: string;
  phoneMask?: string;
  avatar?: string;
  packageId?: string;
  packageKey?: string;
  title: string;
  price: number;
  imageCount: number;
  beforeTotal?: number;
  beforeUsed?: number;
  beforeRemaining?: number;
  afterTotal?: number;
  afterUsed?: number;
  afterRemaining?: number;
  productId?: string;
  goodsPrice?: number;
  payEnv?: 0 | 1 | number;
  orderType?: number;
  wxOrderStatus?: number;
  wxEnvType?: number;
  confirmingAt?: number;
  status: 'paid' | 'pending' | 'failed' | 'refunded' | string;
  payType: 'mock' | string;
  createdAt?: number;
  paidAt?: number;
}

// 统计数据类型
export interface DashboardStats {
  dau: number;
  dauChange: number;
  orders: number;
  ordersChange: number;
  gmv: number;
  gmvChange: number;
  pendingFeedback: number;
}

export interface TrendData {
  date: string;
  dau: number;
  orders: number;
  gmv: number;
}

// 分页请求参数
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
