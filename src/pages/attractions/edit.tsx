import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  message,
  Space,
  Spin,
  Image,
} from 'antd';
import { PlusOutlined, ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAttractionsStore } from '@/stores/attractions';
import { categoryOptions, difficultyOptions, locationOptions, tagOptions } from '@/mock/attractions';
import ImageSelector from '@/components/ImageSelector';
import type { Attraction } from '@/types';
import styles from './edit.module.scss';

const { TextArea } = Input;

const AttractionEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { fetchById, create, update } = useAttractionsStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tipsList, setTipsList] = useState<string[]>(['']);

  // 封面图
  const [coverUrl, setCoverUrl] = useState<string>('');
  // 景点图片
  const [images, setImages] = useState<string[]>([]);

  // 图片选择弹窗
  const [imageSelectorOpen, setImageSelectorOpen] = useState(false);
  const [selectTarget, setSelectTarget] = useState<'cover' | number | null>(null);

  const isEdit = !!id;

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (attractionId: string) => {
    setLoading(true);
    try {
      const data = await fetchById(attractionId);
      if (data) {
        form.setFieldsValue(data);
        setCoverUrl(data.coverImage || '');
        setImages(data.images || []);
        setTags(data.tags || []);
        setTipsList(data.tipsList?.length ? data.tipsList : ['']);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const data: Partial<Attraction> = {
        ...values,
        coverImage: coverUrl,
        images,
        tags,
        tipsList: tipsList.filter((t) => t.trim()),
      };

      let result;
      if (isEdit && id) {
        result = await update(id, data);
      } else {
        result = await create(data);
      }

      if (result.success) {
        message.success(result.message);
        navigate('/attractions');
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // 打开图片选择弹窗
  const handleOpenImageSelector = (target: 'cover' | number) => {
    setSelectTarget(target);
    setImageSelectorOpen(true);
  };

  // 选择图片回调
  const handleImageSelect = (url: string) => {
    if (selectTarget === 'cover') {
      setCoverUrl(url);
    } else if (typeof selectTarget === 'number') {
      const newImages = [...images];
      newImages[selectTarget] = url;
      setImages(newImages);
    }
  };

  // 添加图片
  const handleAddImage = () => {
    // 打开图片选择弹窗，选择后添加到末尾
    setSelectTarget(images.length);
    setImageSelectorOpen(true);
  };

  // 删除图片
  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleTagChange = (tag: string, checked: boolean) => {
    if (checked) {
      setTags([...tags, tag]);
    } else {
      setTags(tags.filter((t) => t !== tag));
    }
  };

  const handleAddTip = () => {
    setTipsList([...tipsList, '']);
  };

  const handleRemoveTip = (index: number) => {
    setTipsList(tipsList.filter((_, i) => i !== index));
  };

  const handleTipChange = (index: number, value: string) => {
    const newTips = [...tipsList];
    newTips[index] = value;
    setTipsList(newTips);
  };

  if (loading && isEdit) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/attractions')}>
          返回列表
        </Button>
        <h1 className={styles.title}>{isEdit ? '编辑景点' : '新增景点'}</h1>
        <Space>
          <Button onClick={() => navigate('/attractions')}>取消</Button>
          <Button type="primary" loading={submitting} onClick={handleSubmit}>
            保存
          </Button>
        </Space>
      </div>

      <Form form={form} layout="vertical">
        {/* 基础信息 */}
        <Card title="基础信息" className={styles.card}>
          <div className={styles.formGrid}>
            <Form.Item
              name="name"
              label="景点名称"
              rules={[{ required: true, message: '请输入景点名称' }]}
            >
              <Input placeholder="请输入景点名称" maxLength={50} />
            </Form.Item>

            <Form.Item
              name="category"
              label="分类"
              rules={[{ required: true, message: '请选择分类' }]}
            >
              <Select placeholder="请选择分类" options={categoryOptions} />
            </Form.Item>

            <Form.Item
              name="location"
              label="所在区域"
              rules={[{ required: true, message: '请选择所在区域' }]}
            >
              <Select
                placeholder="请选择所在区域"
                options={locationOptions.map((l) => ({ value: l, label: l }))}
              />
            </Form.Item>

            <Form.Item
              name="distance"
              label="距离（公里）"
              rules={[{ required: true, message: '请输入距离' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="距离市中心的公里数" />
            </Form.Item>

            <Form.Item
              name="difficulty"
              label="难度"
              rules={[{ required: true, message: '请选择难度' }]}
            >
              <Select placeholder="请选择难度" options={difficultyOptions} />
            </Form.Item>

            <Form.Item
              name="duration"
              label="游玩时长"
              rules={[{ required: true, message: '请输入游玩时长' }]}
            >
              <Input placeholder="如：1天、半天" />
            </Form.Item>

            <Form.Item
              name="bestSeason"
              label="最佳季节"
              rules={[{ required: true, message: '请输入最佳季节' }]}
            >
              <Input placeholder="如：春夏秋、四季" />
            </Form.Item>

            <Form.Item
              name="altitude"
              label="海拔"
            >
              <Input placeholder="如：2303m（可选）" />
            </Form.Item>

            <Form.Item
              name="openTime"
              label="开放时间"
              rules={[{ required: true, message: '请输入开放时间' }]}
            >
              <Input placeholder="如：全天开放、8:00-17:00" />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="景点描述"
            rules={[{ required: true, message: '请输入景点描述' }]}
          >
            <TextArea rows={4} placeholder="请输入景点描述" maxLength={500} showCount />
          </Form.Item>
        </Card>

        {/* 图片管理 */}
        <Card title="图片管理" className={styles.card}>
          {/* 封面图 */}
          <Form.Item label="封面图" required>
            <div className={styles.coverUpload}>
              {coverUrl ? (
                <div className={styles.coverPreview}>
                  <Image
                    src={coverUrl}
                    width={200}
                    height={150}
                    style={{ objectFit: 'cover', borderRadius: 8 }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                  />
                  <div className={styles.coverActions}>
                    <Button size="small" onClick={() => handleOpenImageSelector('cover')}>
                      更换封面
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={styles.coverUploader}
                  onClick={() => handleOpenImageSelector('cover')}
                >
                  <PlusOutlined />
                  <div className={styles.uploaderText}>选择图片</div>
                </div>
              )}
              <div className={styles.uploadHint}>建议尺寸 400x300</div>
            </div>
          </Form.Item>

          {/* 景点图片 */}
          <Form.Item label="景点图片">
            <div className={styles.imageList}>
              {images.map((img, index) => (
                <div key={index} className={styles.imageItem}>
                  {img ? (
                    <div className={styles.imagePreview}>
                      <Image
                        src={img}
                        width={120}
                        height={90}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                      />
                      <div className={styles.imageActions}>
                        <Button size="small" onClick={() => handleOpenImageSelector(index)}>
                          更换
                        </Button>
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveImage(index)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      className={styles.imageUploader}
                      onClick={() => handleOpenImageSelector(index)}
                    >
                      <PlusOutlined />
                      <div className={styles.uploaderText}>选择</div>
                    </div>
                  )}
                </div>
              ))}
              <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddImage}>
                添加图片
              </Button>
            </div>
            <div className={styles.uploadHint}>点击选择已有图片</div>
          </Form.Item>
        </Card>

        {/* 标签选择 */}
        <Card title="标签" className={styles.card}>
          <div className={styles.tags}>
            {tagOptions.map((tag) => (
              <span
                key={tag}
                className={`${styles.tag} ${tags.includes(tag) ? styles.active : ''}`}
                onClick={() => handleTagChange(tag, !tags.includes(tag))}
              >
                {tag}
              </span>
            ))}
          </div>
        </Card>

        {/* 温馨提示 */}
        <Card title="温馨提示" className={styles.card}>
          <div className={styles.tipsList}>
            {tipsList.map((tip, index) => (
              <div key={index} className={styles.tipItem}>
                <Input
                  value={tip}
                  onChange={(e) => handleTipChange(index, e.target.value)}
                  placeholder={`提示 ${index + 1}`}
                />
                {tipsList.length > 1 && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveTip(index)}
                  />
                )}
              </div>
            ))}
            <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddTip}>
              添加提示
            </Button>
          </div>
        </Card>
      </Form>

      {/* 图片选择弹窗 */}
      <ImageSelector
        open={imageSelectorOpen}
        onSelect={handleImageSelect}
        onClose={() => {
          setImageSelectorOpen(false);
          setSelectTarget(null);
        }}
      />
    </div>
  );
};

export default AttractionEdit;
