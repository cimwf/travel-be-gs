import cloudbase from '@cloudbase/js-sdk';

// 云开发环境 ID
const envId = 'cloud1-1gxcobd051830cce';

// 初始化云开发
const app = cloudbase.init({
  env: envId,
});

// 获取数据库引用
export const db = app.database();

// 获取 auth 引用
export const auth = app.auth({
  persistence: 'local',
});

export default app;
