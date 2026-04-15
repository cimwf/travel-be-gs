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

// 上传文件到云存储
export const uploadFile = async (file: File): Promise<{ success: boolean; url: string; message: string }> => {
  try {
    await initCloudBase();

    // 生成唯一文件名
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `attractions/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const result = await app.uploadFile({
      cloudPath: fileName,
      filePath: file,
    });

    if (result.fileID) {
      // 获取临时访问链接
      const urlResult = await app.getTempFileURL({
        fileList: [result.fileID],
      });

      console.log('获取临时链接结果:', urlResult);

      if (urlResult.fileList && urlResult.fileList[0] && urlResult.fileList[0].tempFileURL) {
        return {
          success: true,
          url: urlResult.fileList[0].tempFileURL,
          message: '上传成功',
        };
      }

      // 如果获取临时链接失败，返回 fileID
      return {
        success: true,
        url: result.fileID,
        message: '上传成功',
      };
    }

    return { success: false, url: '', message: '上传失败：未返回 fileID' };
  } catch (error: unknown) {
    console.error('Upload file error:', error);
    const err = error as { message?: string; code?: string };
    const errMsg = err?.message || JSON.stringify(error);
    return { success: false, url: '', message: `上传失败：${errMsg}` };
  }
};

export default app;
