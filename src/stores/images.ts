import { create } from 'zustand';
import { getDb, initCloudBase, uploadFile, deleteCloudFile } from '@/utils/cloudbase';

export interface ImageItem {
  _id: string;
  name: string;
  url: string;
  fileID: string;
  folderId: string;
  createdAt: number;
}

export interface ImageFolder {
  _id: string;
  name: string;
  parentId: string;
  createdAt: number;
}

interface ImagesState {
  images: ImageItem[];
  folders: ImageFolder[];
  loading: boolean;

  // 文件夹操作
  fetchFolders: () => Promise<void>;
  createFolder: (name: string, parentId?: string) => Promise<{ success: boolean; message: string }>;
  renameFolder: (id: string, name: string) => Promise<{ success: boolean; message: string }>;
  deleteFolder: (id: string) => Promise<{ success: boolean; message: string }>;

  // 图片操作
  fetchImages: (folderId?: string) => Promise<void>;
  uploadImage: (file: File, folderId?: string) => Promise<{ success: boolean; message: string; url?: string }>;
  importImage: (url: string, name?: string, folderId?: string) => Promise<{ success: boolean; message: string }>;
  importImages: (urls: string[], folderId?: string) => Promise<{ success: number; failed: number }>;
  deleteImage: (id: string, fileID?: string) => Promise<{ success: boolean; message: string }>;
}

const COLLECTION_IMAGES = 'beImages';
const COLLECTION_FOLDERS = 'beImage_folder';

export const useImagesStore = create<ImagesState>((set, get) => ({
  images: [],
  folders: [],
  loading: false,

  // 获取所有文件夹
  fetchFolders: async () => {
    try {
      await initCloudBase();
      const db = getDb();

      const result = await db
        .collection(COLLECTION_FOLDERS)
        .orderBy('createdAt', 'desc')
        .get();

      set({ folders: (result.data || []) as ImageFolder[] });
    } catch (error) {
      console.error('Fetch folders error:', error);
    }
  },

  // 创建文件夹
  createFolder: async (name: string, parentId = '') => {
    try {
      await initCloudBase();
      const db = getDb();

      await db.collection(COLLECTION_FOLDERS).add({
        name,
        parentId,
        createdAt: Date.now(),
      });

      // 刷新列表
      get().fetchFolders();

      return { success: true, message: '创建成功' };
    } catch (error) {
      console.error('Create folder error:', error);
      return { success: false, message: '创建失败' };
    }
  },

  // 重命名文件夹
  renameFolder: async (id: string, name: string) => {
    try {
      await initCloudBase();
      const db = getDb();

      await db.collection(COLLECTION_FOLDERS).doc(id).update({
        name,
      });

      // 刷新列表
      get().fetchFolders();

      return { success: true, message: '重命名成功' };
    } catch (error) {
      console.error('Rename folder error:', error);
      return { success: false, message: '重命名失败' };
    }
  },

  // 删除文件夹
  deleteFolder: async (id: string) => {
    try {
      await initCloudBase();
      const db = getDb();

      // 检查文件夹下是否有图片
      const imagesResult = await db
        .collection(COLLECTION_IMAGES)
        .where({ folderId: id })
        .count();

      if (imagesResult.total > 0) {
        return { success: false, message: '文件夹下有图片，请先删除图片' };
      }

      await db.collection(COLLECTION_FOLDERS).doc(id).remove();

      // 刷新列表
      get().fetchFolders();

      return { success: true, message: '删除成功' };
    } catch (error) {
      console.error('Delete folder error:', error);
      return { success: false, message: '删除失败' };
    }
  },

  // 获取图片列表
  fetchImages: async (folderId?: string) => {
    set({ loading: true });

    try {
      await initCloudBase();
      const db = getDb();

      const whereCond: Record<string, unknown> = {};
      if (folderId) {
        whereCond.folderId = folderId;
      }

      const result = await db
        .collection(COLLECTION_IMAGES)
        .where(whereCond)
        .orderBy('createdAt', 'desc')
        .get();

      set({
        images: (result.data || []) as ImageItem[],
        loading: false,
      });
    } catch (error) {
      console.error('Fetch images error:', error);
      set({ images: [], loading: false });
    }
  },

  // 上传图片
  uploadImage: async (file: File, folderId = '') => {
    try {
      // 先上传文件到云存储
      const uploadResult = await uploadFile(file);

      if (!uploadResult.success) {
        return { success: false, message: uploadResult.message };
      }

      // 保存图片信息到数据库
      await initCloudBase();
      const db = getDb();

      const imageData = {
        name: file.name,
        url: uploadResult.url,
        fileID: uploadResult.fileID, // 保存真实的 fileID 用于删除
        folderId,
        createdAt: Date.now(),
      };

      await db.collection(COLLECTION_IMAGES).add(imageData);

      // 刷新列表
      get().fetchImages(folderId || undefined);

      return {
        success: true,
        message: '上传成功',
        url: uploadResult.url,
      };
    } catch (error) {
      console.error('Upload image error:', error);
      return { success: false, message: '上传失败' };
    }
  },

  // 导入单张图片（通过 URL）
  importImage: async (url: string, name = '', folderId = '') => {
    try {
      await initCloudBase();
      const db = getDb();

      // 从 URL 提取文件名
      const urlName = url.split('/').pop() || '';
      const finalName = name || urlName.split('?')[0] || `image-${Date.now()}`;

      await db.collection(COLLECTION_IMAGES).add({
        name: finalName,
        url,
        fileID: url,
        folderId,
        createdAt: Date.now(),
      });

      // 刷新列表
      get().fetchImages(folderId || undefined);

      return { success: true, message: '导入成功' };
    } catch (error) {
      console.error('Import image error:', error);
      return { success: false, message: '导入失败' };
    }
  },

  // 批量导入图片
  importImages: async (urls: string[], folderId = '') => {
    let success = 0;
    let failed = 0;

    await initCloudBase();
    const db = getDb();

    for (const url of urls) {
      try {
        const urlName = url.split('/').pop() || '';
        const name = urlName.split('?')[0] || `image-${Date.now()}`;

        await db.collection(COLLECTION_IMAGES).add({
          name,
          url,
          fileID: url,
          folderId,
          createdAt: Date.now(),
        });
        success++;
      } catch {
        failed++;
      }
    }

    // 刷新列表
    get().fetchImages(folderId || undefined);

    return { success, failed };
  },

  // 删除图片
  deleteImage: async (id: string, fileID?: string) => {
    try {
      // 先删除云存储文件
      if (fileID && fileID.startsWith('cloud://')) {
        await deleteCloudFile(fileID);
      }

      // 再删除数据库记录
      await initCloudBase();
      const db = getDb();
      await db.collection(COLLECTION_IMAGES).doc(id).remove();

      // 刷新列表
      get().fetchImages();

      return { success: true, message: '删除成功' };
    } catch (error) {
      console.error('Delete image error:', error);
      return { success: false, message: '删除失败' };
    }
  },
}));
