import cloudbase from '@cloudbase/js-sdk';

// 云开发环境 ID
const envId = 'cloud1-1gxcobd051830cce';

// 初始化云开发
const app = cloudbase.init({
  env: envId,
});

// 获取 auth 引用
export const auth = app.auth({
  persistence: 'local',
});

// 初始化匿名登录
let initialized = false;

export const initCloudBase = async () => {
  if (initialized) {
    return true;
  }

  try {
    // 检查是否已登录
    const loginState = await auth.getLoginState();
    if (!loginState) {
      // 匿名登录
      await auth.signInAnonymously();
    }
    initialized = true;
    return true;
  } catch (error) {
    console.error('CloudBase init error:', error);
    return false;
  }
};

// 获取数据库引用
export const getDb = () => app.database();

export default app;
