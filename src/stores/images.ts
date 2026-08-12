import { create } from 'zustand';
import { uploadFile, deleteCloudFile } from '@/utils/cloudbase';
import { adminBatchCreate, adminCreate, adminDelete, adminList, adminUpdate } from '@/utils/adminApi';

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
  fetchAllImages: () => Promise<ImageItem[]>;
  uploadImage: (file: File, folderId?: string) => Promise<{ success: boolean; message: string; url?: string }>;
  importImage: (url: string, name?: string, folderId?: string) => Promise<{ success: boolean; message: string }>;
  importImages: (urls: string[], folderId?: string) => Promise<{ success: number; failed: number }>;
  deleteImage: (id: string, fileID?: string) => Promise<{ success: boolean; message: string }>;
}

export const useImagesStore = create<ImagesState>((set, get) => ({
  images: [],
  folders: [],
  loading: false,

  // 获取所有文件夹
  fetchFolders: async () => {
    try {
      const result = await adminList<ImageFolder>('imageFolders', { page: 1, pageSize: 1000 });
      if (!result.success) throw new Error(result.error);
      set({ folders: result.items || [] });
    } catch (error) {
      console.error('Fetch folders error:', error);
    }
  },

  // 创建文件夹
  createFolder: async (name: string, parentId = '') => {
    try {
      const result = await adminCreate('imageFolders', {
        name,
        parentId,
        createdAt: Date.now(),
      });
      if (!result.success) throw new Error(result.error);

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
      const result = await adminUpdate('imageFolders', id, { name });
      if (!result.success) throw new Error(result.error);

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
      const result = await adminDelete('imageFolders', id);
      if (!result.success) return { success: false, message: result.error || '删除失败' };

      // 刷新列表
      get().fetchFolders();

      return { success: true, message: '删除成功' };
    } catch (error) {
      console.error('Delete folder error:', error);
      return { success: false, message: '删除失败' };
    }
  },

  // 获取所有图片（不分文件夹）
  fetchAllImages: async () => {
    try {
      const result = await adminList<ImageItem>('images', { page: 1, pageSize: 2000 });
      if (!result.success) throw new Error(result.error);
      return result.items || [];
    } catch (error) {
      console.error('Fetch all images error:', error);
      return [];
    }
  },

  // 获取图片列表
  fetchImages: async (folderId?: string) => {
    set({ loading: true });

    try {
      const result = await adminList<ImageItem>('images', { page: 1, pageSize: 2000, filters: { folderId } });
      if (!result.success) throw new Error(result.error);

      set({
        images: result.items || [],
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

      const imageData = {
        name: file.name,
        url: uploadResult.url,
        fileID: uploadResult.fileID, // 保存真实的 fileID 用于删除
        folderId,
        createdAt: Date.now(),
      };

      const result = await adminCreate('images', imageData);
      if (!result.success) throw new Error(result.error);

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
      // 从 URL 提取文件名
      const urlName = url.split('/').pop() || '';
      const finalName = name || urlName.split('?')[0] || `image-${Date.now()}`;

      const result = await adminCreate('images', {
        name: finalName,
        url,
        fileID: url,
        folderId,
        createdAt: Date.now(),
      });
      if (!result.success) throw new Error(result.error);

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

    const items = urls.map((url) => {
        const urlName = url.split('/').pop() || '';
        const name = urlName.split('?')[0] || `image-${Date.now()}`;
        return {
          name,
          url,
          fileID: url,
          folderId,
          createdAt: Date.now(),
        };
    });
    const result = await adminBatchCreate('images', items);
    success = result.success ? (result.count || 0) : 0;
    failed = urls.length - success;

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

      const result = await adminDelete('images', id);
      if (!result.success) throw new Error(result.error);

      // 刷新列表
      get().fetchImages();

      return { success: true, message: '删除成功' };
    } catch (error) {
      console.error('Delete image error:', error);
      return { success: false, message: '删除失败' };
    }
  },
}));
