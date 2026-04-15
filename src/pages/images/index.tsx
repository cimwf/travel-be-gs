import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Input,
  Modal,
  Image,
  Empty,
  Spin,
  Popconfirm,
  message,
  Breadcrumb,
  Upload,
} from 'antd';
import {
  FolderOutlined,
  FileImageOutlined,
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
  ImportOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useImagesStore, type ImageFolder } from '@/stores/images';
import styles from './index.module.scss';

const { TextArea } = Input;

const ImagesPage: React.FC = () => {
  const {
    images,
    folders,
    loading,
    fetchImages,
    fetchFolders,
    createFolder,
    renameFolder,
    deleteFolder,
    uploadImage,
    importImages,
    deleteImage,
  } = useImagesStore();

  const [currentFolderId, setCurrentFolderId] = useState<string>('');
  const [folderPath, setFolderPath] = useState<ImageFolder[]>([]);
  const [createFolderVisible, setCreateFolderVisible] = useState(false);
  const [renameFolderVisible, setRenameFolderVisible] = useState(false);
  const [renameFolderId, setRenameFolderId] = useState<string>('');
  const [renameFolderName, setRenameFolderName] = useState('');
  const [importVisible, setImportVisible] = useState(false);
  const [importUrls, setImportUrls] = useState('');
  const [importing, setImporting] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    fetchFolders();
    fetchImages();
  }, []);

  useEffect(() => {
    fetchImages(currentFolderId || undefined);
  }, [currentFolderId]);

  // 进入文件夹
  const handleEnterFolder = (folder: ImageFolder) => {
    setCurrentFolderId(folder._id);
    setFolderPath([...folderPath, folder]);
  };

  // 返回上级或根目录
  const handleNavigateBack = (index: number) => {
    if (index === -1) {
      // 返回根目录
      setCurrentFolderId('');
      setFolderPath([]);
    } else {
      // 返回指定层级
      const newPath = folderPath.slice(0, index + 1);
      setCurrentFolderId(newPath[newPath.length - 1]._id);
      setFolderPath(newPath);
    }
  };

  // 创建文件夹
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      message.error('请输入文件夹名称');
      return;
    }

    const result = await createFolder(newFolderName, currentFolderId);
    if (result.success) {
      message.success(result.message);
      setCreateFolderVisible(false);
      setNewFolderName('');
    } else {
      message.error(result.message);
    }
  };

  // 打开重命名弹窗
  const handleOpenRename = (folder: ImageFolder) => {
    setRenameFolderId(folder._id);
    setRenameFolderName(folder.name);
    setRenameFolderVisible(true);
  };

  // 重命名文件夹
  const handleRenameFolder = async () => {
    if (!renameFolderName.trim()) {
      message.error('请输入文件夹名称');
      return;
    }

    const result = await renameFolder(renameFolderId, renameFolderName);
    if (result.success) {
      message.success(result.message);
      setRenameFolderVisible(false);
    } else {
      message.error(result.message);
    }
  };

  // 删除文件夹
  const handleDeleteFolder = async (id: string) => {
    const result = await deleteFolder(id);
    if (result.success) {
      message.success(result.message);
    } else {
      message.error(result.message);
    }
  };

  // 上传图片
  const handleUpload = async (file: File) => {
    const result = await uploadImage(file, currentFolderId);
    if (result.success) {
      message.success(result.message);
    } else {
      message.error(result.message);
    }
    return false;
  };

  // 批量导入图片
  const handleImport = async () => {
    const urls = importUrls
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.startsWith('http'));

    if (urls.length === 0) {
      message.error('请输入有效的图片 URL');
      return;
    }

    setImporting(true);
    const result = await importImages(urls, currentFolderId);
    setImporting(false);

    if (result.success > 0) {
      message.success(`成功导入 ${result.success} 张图片${result.failed > 0 ? `，失败 ${result.failed} 张` : ''}`);
      setImportVisible(false);
      setImportUrls('');
    } else {
      message.error('导入失败，请检查 URL 格式');
    }
  };

  // 删除图片
  const handleDeleteImage = async (id: string, fileID?: string) => {
    const result = await deleteImage(id, fileID);
    if (result.success) {
      message.success(result.message);
    } else {
      message.error(result.message);
    }
  };

  // 当前文件夹下的子文件夹
  const currentFolders = folders.filter((f) => f.parentId === currentFolderId);
  // 当前文件夹下的图片
  const currentImages = images.filter((i) => i.folderId === currentFolderId);

  return (
    <div className={styles.container}>
      <div className="page-header">
        <h1 className="page-title">图片资源</h1>
      </div>

      <Card>
        {/* 工具栏 */}
        <div className={styles.toolbar}>
          <div className={styles.breadcrumb}>
            <Breadcrumb>
              <Breadcrumb.Item onClick={() => handleNavigateBack(-1)} className={styles.breadcrumbItem}>
                <span className={styles.rootFolder}>根目录</span>
              </Breadcrumb.Item>
              {folderPath.map((folder, index) => (
                <Breadcrumb.Item key={folder._id}>
                  <span
                    className={styles.breadcrumbItem}
                    onClick={() => handleNavigateBack(index)}
                  >
                    {folder.name}
                  </span>
                </Breadcrumb.Item>
              ))}
            </Breadcrumb>
          </div>

          <div className={styles.actions}>
            <Button icon={<PlusOutlined />} onClick={() => setCreateFolderVisible(true)}>
              新建文件夹
            </Button>
            <Button icon={<ImportOutlined />} onClick={() => setImportVisible(true)}>
              批量导入
            </Button>
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={handleUpload}
            >
              <Button type="primary" icon={<UploadOutlined />}>
                上传图片
              </Button>
            </Upload>
          </div>
        </div>

        {/* 内容区域 */}
        <Spin spinning={loading}>
          <div className={styles.content}>
            {/* 文件夹列表 */}
            {currentFolders.length > 0 && (
              <div className={styles.folderList}>
                {currentFolders.map((folder) => (
                  <div
                    key={folder._id}
                    className={styles.folderListItem}
                    onClick={() => handleEnterFolder(folder)}
                  >
                    <div className={styles.folderListContent}>
                      <FolderOutlined className={styles.folderListIcon} />
                      <span className={styles.folderListName}>{folder.name}</span>
                    </div>
                    <div className={styles.folderActions}>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenRename(folder);
                        }}
                      />
                      <Popconfirm
                        title="确定删除此文件夹？"
                        onConfirm={(e) => {
                          e?.stopPropagation();
                          handleDeleteFolder(folder._id);
                        }}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Popconfirm>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 图片列表 */}
            {currentImages.length > 0 && (
              <div className={styles.imageGrid}>
                {currentImages.map((image) => (
                  <div key={image._id} className={styles.imageItem}>
                    <Image
                      src={image.url}
                      alt={image.name}
                      className={styles.image}
                      fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                    />
                    <div className={styles.imageInfo}>
                      <span className={styles.imageName} title={image.name}>
                        {image.name}
                      </span>
                      <Popconfirm
                        title="确定删除此图片？"
                        onConfirm={() => handleDeleteImage(image._id, image.fileID)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 空状态 */}
            {currentFolders.length === 0 && currentImages.length === 0 && (
              <Empty description="暂无内容" />
            )}
          </div>
        </Spin>
      </Card>

      {/* 创建文件夹弹窗 */}
      <Modal
        title="新建文件夹"
        open={createFolderVisible}
        onOk={handleCreateFolder}
        onCancel={() => {
          setCreateFolderVisible(false);
          setNewFolderName('');
        }}
        okText="创建"
        cancelText="取消"
      >
        <Input
          placeholder="请输入文件夹名称"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onPressEnter={handleCreateFolder}
        />
      </Modal>

      {/* 重命名文件夹弹窗 */}
      <Modal
        title="重命名文件夹"
        open={renameFolderVisible}
        onOk={handleRenameFolder}
        onCancel={() => setRenameFolderVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Input
          placeholder="请输入新的文件夹名称"
          value={renameFolderName}
          onChange={(e) => setRenameFolderName(e.target.value)}
          onPressEnter={handleRenameFolder}
        />
      </Modal>

      {/* 批量导入弹窗 */}
      <Modal
        title="批量导入图片"
        open={importVisible}
        onOk={handleImport}
        onCancel={() => {
          setImportVisible(false);
          setImportUrls('');
        }}
        okText="导入"
        cancelText="取消"
        confirmLoading={importing}
      >
        <div style={{ marginBottom: 8, color: '#666' }}>
          每行一个图片 URL，支持云存储临时链接或外部链接
        </div>
        <TextArea
          rows={8}
          placeholder="https://example.com/image1.jpg
https://example.com/image2.jpg
..."
          value={importUrls}
          onChange={(e) => setImportUrls(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default ImagesPage;
