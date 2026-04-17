import cloudbase from '@cloudbase/js-sdk';

// 云开发环境 ID
const envId = 'cloud1-1gxcobd051830cce';

console.log('CloudBase 环境 ID:', envId);

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
    console.log('登录状态:', loginState);

    if (!loginState) {
      // 匿名登录
      const signInResult = await auth.signInAnonymously();
      console.log('匿名登录结果:', signInResult);
    }
    initialized = true;
    return true;
  } catch (error) {
    console.error('CloudBase init error:', error);
    return false;
  }
};

// 测试数据库连接
export const testDatabase = async () => {
  try {
    await initCloudBase();
    const db = getDb();

    console.log('测试访问 places 集合...');
    const placesResult = await db.collection('places').limit(1).get();
    console.log('places 集合访问成功:', placesResult);

    console.log('测试访问 images 集合...');
    const imagesResult = await db.collection('beImages').limit(1).get();
    console.log('beImages 集合访问成功:', imagesResult);

    return { success: true };
  } catch (error) {
    console.error('数据库测试失败:', error);
    return { success: false, error };
  }
};

// 获取数据库引用
export const getDb = () => app.database();

// 上传文件到云存储
export const uploadFile = async (file: File): Promise<{ success: boolean; url: string; fileID: string; message: string }> => {
  try {
    await initCloudBase();

    // 生成唯一文件名
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `attractions/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const result = await app.uploadFile({
      cloudPath: fileName,
      filePath: file as unknown as string,
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
          fileID: result.fileID,
          message: '上传成功',
        };
      }

      // 如果获取临时链接失败，返回 fileID
      return {
        success: true,
        url: result.fileID,
        fileID: result.fileID,
        message: '上传成功',
      };
    }

    return { success: false, url: '', fileID: '', message: '上传失败：未返回 fileID' };
  } catch (error: unknown) {
    console.error('Upload file error:', error);
    const err = error as { message?: string; code?: string };
    const errMsg = err?.message || JSON.stringify(error);
    return { success: false, url: '', fileID: '', message: `上传失败：${errMsg}` };
  }
};

// 删除云存储文件
export const deleteCloudFile = async (fileID: string): Promise<{ success: boolean; message: string }> => {
  try {
    await initCloudBase();

    const result = await app.deleteFile({
      fileList: [fileID],
    });

    console.log('删除云存储文件结果:', result);

    if (result.fileList && result.fileList[0] && result.fileList[0].code === 'SUCCESS') {
      return { success: true, message: '删除成功' };
    }

    return { success: false, message: '删除失败' };
  } catch (error) {
    console.error('Delete cloud file error:', error);
    return { success: false, message: '删除云存储文件失败' };
  }
};

export default app;
