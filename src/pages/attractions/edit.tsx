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
  Collapse,
} from 'antd';
import { PlusOutlined, ArrowLeftOutlined, DeleteOutlined, ImportOutlined } from '@ant-design/icons';
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

  // 新增数组字段
  const [highlight, setHighlight] = useState<string[]>(['']);
  const [features, setFeatures] = useState<string[]>(['']);
  const [suitableFor, setSuitableFor] = useState<string[]>(['']);
  const [avoidFor, setAvoidFor] = useState<string[]>(['']);

  // 封面图
  const [coverUrl, setCoverUrl] = useState<string>('');
  // 景点图片
  const [images, setImages] = useState<string[]>([]);

  // 图片选择弹窗
  const [imageSelectorOpen, setImageSelectorOpen] = useState(false);
  const [selectTarget, setSelectTarget] = useState<'cover' | number | null>(null);

  // JSON 导入
  const [jsonInput, setJsonInput] = useState('');

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
        setHighlight(data.highlight?.length ? data.highlight : ['']);
        setFeatures(data.features?.length ? data.features : ['']);
        setSuitableFor(data.suitableFor?.length ? data.suitableFor : ['']);
        setAvoidFor(data.avoidFor?.length ? data.avoidFor : ['']);
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
        highlight: highlight.filter((t) => t.trim()),
        features: features.filter((t) => t.trim()),
        suitableFor: suitableFor.filter((t) => t.trim()),
        avoidFor: avoidFor.filter((t) => t.trim()),
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

  // 数组字段处理函数
  const handleArrayAdd = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    arr: string[]
  ) => {
    setter([...arr, '']);
  };

  const handleArrayRemove = (
    index: number,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    arr: string[]
  ) => {
    setter(arr.filter((_, i) => i !== index));
  };

  const handleArrayChange = (
    index: number,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    arr: string[]
  ) => {
    const newArr = [...arr];
    newArr[index] = value;
    setter(newArr);
  };

  // 解析 JSON 并填充表单
  const handleParseJson = () => {
    try {
      const data = JSON.parse(jsonInput);

      // 填充表单字段
      if (data.name) form.setFieldValue('name', data.name);
      if (data.category) form.setFieldValue('category', data.category);
      if (data.location) form.setFieldValue('location', data.location);
      if (data.distance !== undefined) form.setFieldValue('distance', data.distance);
      if (data.difficulty) form.setFieldValue('difficulty', data.difficulty);
      if (data.difficultyDesc) form.setFieldValue('difficultyDesc', data.difficultyDesc);
      if (data.duration) form.setFieldValue('duration', data.duration);
      if (data.timeCostDetail) form.setFieldValue('timeCostDetail', data.timeCostDetail);
      if (data.bestSeason) form.setFieldValue('bestSeason', data.bestSeason);
      if (data.altitude) form.setFieldValue('altitude', data.altitude);
      if (data.openTime) form.setFieldValue('openTime', data.openTime);
      if (data.intro) form.setFieldValue('intro', data.intro);
      if (data.description) form.setFieldValue('description', data.description);
      if (data.cost) form.setFieldValue('cost', data.cost);
      if (data.transport) form.setFieldValue('transport', data.transport);
      if (data.rating !== undefined) form.setFieldValue('rating', data.rating);

      // 填充图片
      if (data.coverImage) setCoverUrl(data.coverImage);
      if (data.images && Array.isArray(data.images)) setImages(data.images);

      // 填充标签
      if (data.tags && Array.isArray(data.tags)) setTags(data.tags);

      // 填充数组字段
      if (data.tipsList && Array.isArray(data.tipsList) && data.tipsList.length > 0) {
        setTipsList(data.tipsList);
      }
      if (data.highlight && Array.isArray(data.highlight) && data.highlight.length > 0) {
        setHighlight(data.highlight);
      }
      if (data.features && Array.isArray(data.features) && data.features.length > 0) {
        setFeatures(data.features);
      }
      if (data.suitableFor && Array.isArray(data.suitableFor) && data.suitableFor.length > 0) {
        setSuitableFor(data.suitableFor);
      }
      if (data.avoidFor && Array.isArray(data.avoidFor) && data.avoidFor.length > 0) {
        setAvoidFor(data.avoidFor);
      }

      message.success('JSON 解析成功，已填充表单');
      setJsonInput('');
    } catch {
      message.error('JSON 格式错误，请检查');
    }
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
        {/* JSON 导入 */}
        <Card className={styles.card}>
          <Collapse
            ghost
            items={[
              {
                key: 'json',
                label: (
                  <Space>
                    <ImportOutlined />
                    <span>JSON 快速填充</span>
                  </Space>
                ),
                children: (
                  <div>
                    <div style={{ marginBottom: 8, color: '#666' }}>
                      粘贴 JSON 数据，点击解析后自动填充表单各字段
                    </div>
                    <Space.Compact style={{ width: '100%' }}>
                      <TextArea
                        rows={4}
                        placeholder='{"name": "景点名", "category": "爬山", ...}'
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <Button type="primary" onClick={handleParseJson}>
                        解析填充
                      </Button>
                    </Space.Compact>
                  </div>
                ),
              },
            ]}
          />
        </Card>

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
              name="difficultyDesc"
              label="难度描述"
            >
              <Input placeholder="如：路线较长且爬升明显，对体力要求较高" />
            </Form.Item>

            <Form.Item
              name="duration"
              label="游玩时长"
              rules={[{ required: true, message: '请输入游玩时长' }]}
            >
              <Input placeholder="如：1天、半天" />
            </Form.Item>

            <Form.Item
              name="timeCostDetail"
              label="时间详情"
            >
              <Input placeholder="如：单程登顶约4-6小时" />
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

            <Form.Item
              name="cost"
              label="费用"
            >
              <Input placeholder="如：人均50-100元" />
            </Form.Item>

            <Form.Item
              name="transport"
              label="交通"
            >
              <Input placeholder="如：建议自驾，导航至xxx" />
            </Form.Item>

            <Form.Item
              name="rating"
              label="评分"
            >
              <InputNumber min={0} max={5} step={0.1} style={{ width: '100%' }} placeholder="0-5分" />
            </Form.Item>
          </div>

          <Form.Item
            name="intro"
            label="简介"
          >
            <Input placeholder="一句话介绍，如：北京最高峰，云海日出+高山草甸" />
          </Form.Item>

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

        {/* 亮点 */}
        <Card title="亮点" className={styles.card}>
          <div className={styles.tipsList}>
            {highlight.map((item, index) => (
              <div key={index} className={styles.tipItem}>
                <Input
                  value={item}
                  onChange={(e) => handleArrayChange(index, e.target.value, setHighlight, highlight)}
                  placeholder={`亮点 ${index + 1}`}
                />
                {highlight.length > 1 && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleArrayRemove(index, setHighlight, highlight)}
                  />
                )}
              </div>
            ))}
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => handleArrayAdd(setHighlight, highlight)}>
              添加亮点
            </Button>
          </div>
        </Card>

        {/* 特色 */}
        <Card title="特色" className={styles.card}>
          <div className={styles.tipsList}>
            {features.map((item, index) => (
              <div key={index} className={styles.tipItem}>
                <Input
                  value={item}
                  onChange={(e) => handleArrayChange(index, e.target.value, setFeatures, features)}
                  placeholder={`特色 ${index + 1}`}
                />
                {features.length > 1 && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleArrayRemove(index, setFeatures, features)}
                  />
                )}
              </div>
            ))}
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => handleArrayAdd(setFeatures, features)}>
              添加特色
            </Button>
          </div>
        </Card>

        {/* 适合人群 */}
        <Card title="适合人群" className={styles.card}>
          <div className={styles.tipsList}>
            {suitableFor.map((item, index) => (
              <div key={index} className={styles.tipItem}>
                <Input
                  value={item}
                  onChange={(e) => handleArrayChange(index, e.target.value, setSuitableFor, suitableFor)}
                  placeholder={`适合人群 ${index + 1}`}
                />
                {suitableFor.length > 1 && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleArrayRemove(index, setSuitableFor, suitableFor)}
                  />
                )}
              </div>
            ))}
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => handleArrayAdd(setSuitableFor, suitableFor)}>
              添加
            </Button>
          </div>
        </Card>

        {/* 不适合人群 */}
        <Card title="不适合人群" className={styles.card}>
          <div className={styles.tipsList}>
            {avoidFor.map((item, index) => (
              <div key={index} className={styles.tipItem}>
                <Input
                  value={item}
                  onChange={(e) => handleArrayChange(index, e.target.value, setAvoidFor, avoidFor)}
                  placeholder={`不适合人群 ${index + 1}`}
                />
                {avoidFor.length > 1 && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleArrayRemove(index, setAvoidFor, avoidFor)}
                  />
                )}
              </div>
            ))}
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => handleArrayAdd(setAvoidFor, avoidFor)}>
              添加
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
