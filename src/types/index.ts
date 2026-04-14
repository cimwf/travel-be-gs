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
  bestSeason: string;              // 最佳季节
  duration: string;                // 游玩时长
  altitude?: string;               // 海拔（可选）
  openTime: string;                // 开放时间
  tipsList: string[];              // 提示列表
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
