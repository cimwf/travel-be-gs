import React, { useState, useEffect } from 'react';
import { Modal, Spin, Image, Empty, Breadcrumb, Upload, Button, Input, message } from 'antd';
import { FolderOutlined, PlusOutlined, UploadOutlined, CheckCircleFilled } from '@ant-design/icons';
import { useImagesStore, type ImageFolder, type ImageItem } from '@/stores/images';
import styles from './index.module.scss';

interface ImageSelectorProps {
  open: boolean;
  onSelect: (url: string) => void;
  onClose: () => void;
  multiple?: boolean;
}

const ImageSelector: React.FC<ImageSelectorProps> = ({
  open,
  onSelect,
  onClose,
  multiple = false,
}) => {
  const {
    images,
    folders,
    loading,
    fetchImages,
    fetchFolders,
    uploadImage,
    createFolder,
  } = useImagesStore();

  const [currentFolderId, setCurrentFolderId] = useState<string>('');
  const [folderPath, setFolderPath] = useState<ImageFolder[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [createFolderVisible, setCreateFolderVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    if (open) {
      fetchFolders();
      fetchImages();
      setSelectedImages([]);
    }
  }, [open]);

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
      setCurrentFolderId('');
      setFolderPath([]);
    } else {
      const newPath = folderPath.slice(0, index + 1);
      setCurrentFolderId(newPath[newPath.length - 1]._id);
      setFolderPath(newPath);
    }
  };

  // 选择图片
  const handleSelectImage = (image: ImageItem) => {
    if (multiple) {
      // 多选模式
      if (selectedImages.includes(image.url)) {
        setSelectedImages(selectedImages.filter((url) => url !== image.url));
      } else {
        setSelectedImages([...selectedImages, image.url]);
      }
    } else {
      // 单选模式，直接返回
      onSelect(image.url);
      onClose();
    }
  };

  // 确认选择（多选模式）
  const handleConfirm = () => {
    selectedImages.forEach((url) => onSelect(url));
    onClose();
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

  // 创建文件夹
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      message.error('请输入文件夹名称');
      return;
    }
    await createFolder(newFolderName, currentFolderId);
    setCreateFolderVisible(false);
    setNewFolderName('');
  };

  // 当前文件夹下的子文件夹
  const currentFolders = folders.filter((f) => f.parentId === currentFolderId);
  // 当前文件夹下的图片
  const currentImages = images.filter((i) => i.folderId === currentFolderId);

  return (
    <Modal
      title="选择图片"
      open={open}
      onCancel={onClose}
      width={800}
      footer={
        multiple ? (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>已选择 {selectedImages.length} 张图片</span>
            <div>
              <Button onClick={onClose}>取消</Button>
              <Button type="primary" onClick={handleConfirm} disabled={selectedImages.length === 0}>
                确定
              </Button>
            </div>
          </div>
        ) : null
      }
    >
      {/* 工具栏 */}
      <div className={styles.toolbar}>
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

        <div className={styles.actions}>
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setCreateFolderVisible(true)}
          >
            新建文件夹
          </Button>
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={handleUpload}
          >
            <Button size="small" type="primary" icon={<UploadOutlined />}>
              上传
            </Button>
          </Upload>
        </div>
      </div>

      {/* 内容区域 */}
      <Spin spinning={loading}>
        <div className={styles.content}>
          {/* 文件夹列表 */}
          {currentFolders.length > 0 && (
            <div className={styles.folderGrid}>
              {currentFolders.map((folder) => (
                <div
                  key={folder._id}
                  className={styles.folderItem}
                  onClick={() => handleEnterFolder(folder)}
                >
                  <FolderOutlined className={styles.folderIcon} />
                  <span className={styles.folderName}>{folder.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* 图片列表 */}
          {currentImages.length > 0 && (
            <div className={styles.imageGrid}>
              {currentImages.map((image) => (
                <div
                  key={image._id}
                  className={`${styles.imageItem} ${selectedImages.includes(image.url) ? styles.selected : ''}`}
                  onClick={() => handleSelectImage(image)}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className={styles.image}
                  />
                  {selectedImages.includes(image.url) && (
                    <div className={styles.selectedMask}>
                      <CheckCircleFilled className={styles.checkIcon} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 空状态 */}
          {currentFolders.length === 0 && currentImages.length === 0 && (
            <Empty description="暂无图片，请上传" />
          )}
        </div>
      </Spin>

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
    </Modal>
  );
};

export default ImageSelector;
