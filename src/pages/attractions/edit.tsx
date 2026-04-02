import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Button,
  Upload,
  message,
  Space,
  Spin,
} from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAttractionsStore } from '@/stores/attractions';
import type { Attraction, Ticket } from '@/types';
import styles from './edit.module.scss';

const { TextArea } = Input;

const districtOptions = [
  '东城区', '西城区', '朝阳区', '海淀区', '丰台区', '石景山区',
  '通州区', '顺义区', '昌平区', '大兴区', '房山区', '门头沟区',
  '平谷区', '怀柔区', '密云区', '延庆区',
];

const categoryOptions = [
  '历史古迹', '自然风光', '主题公园', '博物馆', '宗教寺庙', '园林景观', '现代地标', '其他',
];

const levelOptions = ['AAAAA', 'AAAA', 'AAA', 'AA', 'A', '无等级'];

const daysOptions = ['0.5天', '1天', '1.5天', '2天', '2天以上'];

const difficultyOptions = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
];

const statusOptions = [
  { value: 'online', label: '已上线' },
  { value: 'pending', label: '待审核' },
  { value: 'offline', label: '已下线' },
];

const tagOptions = [
  '亲子推荐', '情侣打卡', '摄影胜地', '文化体验', '户外运动', '避暑胜地', '赏花推荐', '红叶观赏',
];

const AttractionEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentAttraction, loading, fetchById, create, update } = useAttractionsStore();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([
    { type: '成人票', price: 0, description: '' },
  ]);
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  const isEdit = !!id;

  useEffect(() => {
    if (id) {
      fetchById(id);
    }
  }, [id]);

  useEffect(() => {
    if (currentAttraction && isEdit) {
      form.setFieldsValue(currentAttraction);
      setTickets(currentAttraction.tickets || []);
      setImages(currentAttraction.images || []);
      setTags(currentAttraction.tags || []);
    }
  }, [currentAttraction]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const data = {
        ...values,
        tickets,
        images,
        tags,
      };

      let success: boolean;
      if (isEdit && id) {
        success = await update(id, data);
      } else {
        success = await create(data);
      }

      if (success) {
        message.success(isEdit ? '更新成功' : '创建成功');
        navigate('/attractions');
      } else {
        message.error('操作失败');
      }
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTicket = () => {
    setTickets([...tickets, { type: '', price: 0, description: '' }]);
  };

  const handleRemoveTicket = (index: number) => {
    setTickets(tickets.filter((_, i) => i !== index));
  };

  const handleTicketChange = (index: number, field: keyof Ticket, value: string | number) => {
    const newTickets = [...tickets];
    newTickets[index] = { ...newTickets[index], [field]: value };
    setTickets(newTickets);
  };

  const handleTagChange = (tag: string, checked: boolean) => {
    if (checked) {
      setTags([...tags, tag]);
    } else {
      setTags(tags.filter((t) => t !== tag));
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
        {/* 基础信息 */}
        <Card title="📋 基础信息" className={styles.card}>
          <div className={styles.formGrid}>
            <Form.Item
              name="name"
              label="景点名称"
              rules={[{ required: true, message: '请输入景点名称' }]}
            >
              <Input placeholder="请输入景点名称" maxLength={50} />
            </Form.Item>

            <Form.Item
              name="district"
              label="所在区域"
              rules={[{ required: true, message: '请选择所在区域' }]}
            >
              <Select placeholder="请选择所在区域" options={districtOptions.map((d) => ({ value: d, label: d }))} />
            </Form.Item>

            <Form.Item
              name="category"
              label="景点分类"
              rules={[{ required: true, message: '请选择景点分类' }]}
            >
              <Select placeholder="请选择景点分类" options={categoryOptions.map((c) => ({ value: c, label: c }))} />
            </Form.Item>

            <Form.Item name="level" label="景点等级">
              <Select placeholder="请选择景点等级" options={levelOptions.map((l) => ({ value: l, label: l }))} />
            </Form.Item>

            <Form.Item
              name="address"
              label="详细地址"
              rules={[{ required: true, message: '请输入详细地址' }]}
              className={styles.fullWidth}
            >
              <Input placeholder="请输入详细地址" maxLength={100} />
            </Form.Item>

            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select options={statusOptions} />
            </Form.Item>
          </div>
        </Card>

        {/* 游览信息 */}
        <Card title="🎯 游览信息" className={styles.card}>
          <div className={styles.formGrid3}>
            <Form.Item
              name="openTime"
              label="开放时间"
              rules={[{ required: true, message: '请输入开放时间' }]}
            >
              <Input placeholder="如：08:30-17:00" />
            </Form.Item>

            <Form.Item
              name="suggestedDays"
              label="建议游玩天数"
              rules={[{ required: true, message: '请选择建议游玩天数' }]}
            >
              <Select options={daysOptions.map((d) => ({ value: d, label: d }))} />
            </Form.Item>

            <Form.Item
              name="difficulty"
              label="难易程度"
              rules={[{ required: true, message: '请选择难易程度' }]}
            >
              <Select options={difficultyOptions} />
            </Form.Item>
          </div>

          <h4 className={styles.subTitle}>票价信息</h4>
          <div className={styles.tickets}>
            {tickets.map((ticket, index) => (
              <div key={index} className={styles.ticketRow}>
                <Input
                  placeholder="票型"
                  value={ticket.type}
                  onChange={(e) => handleTicketChange(index, 'type', e.target.value)}
                  style={{ width: 120 }}
                />
                <InputNumber
                  placeholder="价格"
                  value={ticket.price}
                  onChange={(value) => handleTicketChange(index, 'price', value ?? 0)}
                  min={0}
                  prefix="¥"
                  style={{ width: 120 }}
                />
                <Input
                  placeholder="说明"
                  value={ticket.description}
                  onChange={(e) => handleTicketChange(index, 'description', e.target.value)}
                  style={{ flex: 1 }}
                />
                {tickets.length > 1 && (
                  <Button danger onClick={() => handleRemoveTicket(index)}>
                    删除
                  </Button>
                )}
              </div>
            ))}
            <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddTicket}>
              添加票型
            </Button>
          </div>

          <Form.Item name="tips" label="温馨提示" className={styles.fullWidth}>
            <TextArea rows={3} placeholder="游览注意事项、穿衣建议、携带物品等" />
          </Form.Item>
        </Card>

        {/* 详细描述 */}
        <Card title="📝 详细描述" className={styles.card}>
          <Form.Item
            name="description"
            label="景点介绍"
            rules={[{ required: true, message: '请输入景点介绍' }]}
          >
            <TextArea rows={4} placeholder="景点的详细介绍，包括历史背景、文化价值、主要看点等" maxLength={2000} />
          </Form.Item>

          <Form.Item
            name="playIntro"
            label="游玩简介"
            rules={[{ required: true, message: '请输入游玩简介' }]}
          >
            <TextArea rows={3} placeholder="简要介绍游玩亮点和推荐路线" maxLength={500} />
          </Form.Item>

          <Form.Item name="locationIntro" label="地点介绍">
            <TextArea rows={2} placeholder="景点周边环境、交通、配套服务等信息" maxLength={500} />
          </Form.Item>

          {isEdit && currentAttraction?.rating ? (
            <div className={styles.ratingInfo}>
              <span className={styles.ratingLabel}>用户评级分数</span>
              <span className={styles.ratingValue}>⭐ {currentAttraction.rating}</span>
              <span className={styles.ratingCount}>({currentAttraction.ratingCount}条评价)</span>
              <span className={styles.ratingNote}>系统自动计算，每小时更新</span>
            </div>
          ) : null}
        </Card>

        {/* 媒体资源 */}
        <Card title="🖼️ 媒体资源" className={styles.card}>
          <Form.Item label="景点图片" required>
            <Upload
              listType="picture-card"
              multiple
              accept="image/*"
              beforeUpload={() => false}
              onChange={() => {}}
            >
              {images.length < 20 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              )}
            </Upload>
            <div className={styles.uploadTip}>至少1张，最多20张，支持JPG/PNG，单张≤5MB</div>
          </Form.Item>

          <Form.Item name="video" label="景点视频">
            <Input placeholder="请输入视频链接或上传视频文件" />
          </Form.Item>

          <div className={styles.formGrid2}>
            <Form.Item label="景点标签">
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
            </Form.Item>

            <Form.Item label="运营设置">
              <div className={styles.operationSettings}>
                <Form.Item name="isRecommended" valuePropName="checked" noStyle>
                  <Switch /> <span>设为推荐景点</span>
                </Form.Item>
                <div className={styles.sortWeight}>
                  <span>排序权重</span>
                  <Form.Item name="sortWeight" noStyle>
                    <InputNumber min={0} max={999} style={{ width: 80 }} />
                  </Form.Item>
                  <span className={styles.sortTip}>数字越大越靠前</span>
                </div>
              </div>
            </Form.Item>
          </div>
        </Card>
      </Form>
    </div>
  );
};

export default AttractionEdit;
