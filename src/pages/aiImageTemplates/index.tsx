import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { useAIImageTemplateStore } from '@/stores/aiImageTemplates';
import type { AIImageTemplate, AIImageTemplateScene } from '@/types';
import styles from './index.module.scss';

const { TextArea } = Input;

const modeOptions = [
  { label: '全部', value: 'all' },
  { label: '文生图', value: 'text' },
  { label: '图生图', value: 'image' },
];

const formModeOptions = [
  { label: '文生图', value: 'text' },
  { label: '图生图', value: 'image' },
];

const ratioOptions = ['1:1', '3:4', '4:3', '9:16'].map((value) => ({ label: value, value }));

const sceneOptions = [
  { label: '全部', value: 'all' },
  { label: '人像', value: '人像' },
  { label: '旅行', value: '旅行' },
  { label: '穿搭', value: '穿搭' },
  { label: '美食', value: '美食' },
  { label: '活动', value: '活动' },
];

const formSceneOptions = [
  { label: '人像', value: '人像' },
  { label: '旅行', value: '旅行' },
  { label: '穿搭', value: '穿搭' },
  { label: '美食', value: '美食' },
  { label: '活动', value: '活动' },
];

const styleOptions = [
  '旅行海报',
  '写实摄影',
  '韩系写真',
  '日系清新',
  '甜酷风',
  '梦幻公主',
  '复古胶片',
  '水彩插画',
  '油画质感',
  '电影感',
  '杂志封面',
  '头像写真',
  '婚纱大片',
  '古风国潮',
  '治愈手账',
  '轻奢穿搭',
].map((value) => ({ label: value, value }));

const AIImageTemplatesPage: React.FC = () => {
  const {
    templates,
    loading,
    total,
    fetchList,
    create,
    update,
    delete: deleteTemplate,
    toggleEnabled,
    seedDefaults,
    clearAll,
  } = useAIImageTemplateStore();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [mode, setMode] = useState<'all' | 'text' | 'image'>('all');
  const [scene, setScene] = useState<'all' | AIImageTemplateScene>('all');
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AIImageTemplate | null>(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    await fetchList({ page, pageSize, mode, scene, keyword });
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, mode, scene, keyword]);

  const handleAdd = () => {
    setEditingTemplate(null);
    form.resetFields();
    form.setFieldsValue({
      mode: 'image',
      ratio: '3:4',
      style: '韩系写真',
      badge: '推荐',
      sort: total + 1,
      enabled: true,
    });
    setModalOpen(true);
  };

  const handleEdit = (record: AIImageTemplate) => {
    setEditingTemplate(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const result = editingTemplate && editingTemplate._id
        ? await update(editingTemplate._id, values)
        : await create(values);

      if (result.success) {
        message.success(result.message);
        setModalOpen(false);
        loadData();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Validate AI image template error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteTemplate(id);
    if (result.success) {
      message.success(result.message);
      loadData();
    } else {
      message.error(result.message);
    }
  };

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    const result = await toggleEnabled(id, enabled);
    if (result.success) {
      message.success(result.message);
    } else {
      message.error(result.message);
    }
  };

  const handleSeedDefaults = async () => {
    const result = await seedDefaults();
    if (result.success) {
      message.success(result.message);
      setPage(1);
      loadData();
    } else {
      message.error(result.message);
    }
  };

  const handleClearAll = async () => {
    const result = await clearAll();
    if (result.success) {
      message.success(result.message);
      setPage(1);
      loadData();
    } else {
      message.error(result.message);
    }
  };

  const columns = [
    {
      title: '模板',
      key: 'title',
      width: 220,
      render: (_: unknown, record: AIImageTemplate) => (
        <div>
          <Space>
            <strong>{record.title}</strong>
            {record.badge && <Tag color="blue">{record.badge}</Tag>}
          </Space>
          <div className={styles.descText}>{record.desc || '-'}</div>
        </div>
      ),
    },
    {
      title: '标识',
      dataIndex: 'templateId',
      key: 'templateId',
      width: 120,
      render: (value: string) => value || '-',
    },
    {
      title: '类型',
      dataIndex: 'mode',
      key: 'mode',
      width: 90,
      render: (value: AIImageTemplate['mode']) => (
        <Tag color={value === 'image' ? 'magenta' : 'green'}>
          {value === 'image' ? '图生图' : '文生图'}
        </Tag>
      ),
    },
    {
      title: '场景',
      dataIndex: 'scene',
      key: 'scene',
      width: 90,
      render: (value: AIImageTemplate['scene']) => {
        const colorMap: Record<string, string> = {
          '人像': 'purple',
          '旅行': 'cyan',
          '穿搭': 'orange',
          '美食': 'volcano',
          '活动': 'blue',
        };
        return value ? (
          <Tag color={colorMap[value] || 'default'}>{value}</Tag>
        ) : (
          <Tag>其他</Tag>
        );
      },
    },
    {
      title: '比例',
      dataIndex: 'ratio',
      key: 'ratio',
      width: 80,
    },
    {
      title: '风格',
      dataIndex: 'style',
      key: 'style',
      width: 120,
      render: (value: string) => value || '无风格',
    },
    {
      title: '提示词',
      dataIndex: 'prompt',
      key: 'prompt',
      render: (value: string) => (
        <div className={styles.promptPreview}>{value}</div>
      ),
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 80,
    },
    {
      title: '反馈',
      key: 'votes',
      width: 110,
      render: (_: unknown, record: AIImageTemplate) => (
        <Space size={8}>
          <Tag color="green">赞 {record.likeCount || 0}</Tag>
          <Tag color="red">踩 {record.dislikeCount || 0}</Tag>
        </Space>
      ),
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 90,
      render: (enabled: boolean, record: AIImageTemplate) => (
        <Switch
          checked={enabled}
          onChange={(checked) => record._id && handleToggleEnabled(record._id, checked)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: AIImageTemplate) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个模板？"
            okText="确定"
            cancelText="取消"
            onConfirm={() => record._id && handleDelete(record._id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className="page-header">
        <h1 className="page-title">AI 模板管理</h1>
      </div>

      <Card>
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <Select
              value={mode}
              options={modeOptions}
              style={{ width: 120 }}
              onChange={(value) => {
                setMode(value);
                setPage(1);
              }}
            />
            <Select
              value={scene}
              options={sceneOptions}
              style={{ width: 120 }}
              onChange={(value) => {
                setScene(value);
                setPage(1);
              }}
            />
            <Input.Search
              allowClear
              placeholder="搜索模板标题"
              style={{ width: 240 }}
              onSearch={(value) => {
                setKeyword(value);
                setPage(1);
              }}
            />
          </div>
          <Space>
            <Popconfirm
              title="确定清空所有模板？此操作不可恢复！"
              okText="确定"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={handleClearAll}
            >
              <Button danger icon={<ClearOutlined />}>一键清空</Button>
            </Popconfirm>
            <Popconfirm
              title="会追加一批默认模板，确定初始化？"
              okText="确定"
              cancelText="取消"
              onConfirm={handleSeedDefaults}
            >
              <Button icon={<ReloadOutlined />}>初始化默认模板</Button>
            </Popconfirm>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增模板
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={templates}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (value) => `共 ${value} 条`,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
        />
      </Card>

      <Modal
        title={editingTemplate ? '编辑 AI 模板' : '新增 AI 模板'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={760}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="mode"
            label="模板类型"
            rules={[{ required: true, message: '请选择模板类型' }]}
          >
            <Select options={formModeOptions} />
          </Form.Item>

          <Form.Item name="scene" label="适用场景">
            <Select allowClear placeholder="不限场景" options={formSceneOptions} />
          </Form.Item>

          <Form.Item
            name="title"
            label="模板标题"
            rules={[{ required: true, message: '请输入模板标题' }]}
          >
            <Input placeholder="例如：清透约拍" maxLength={30} showCount />
          </Form.Item>

          <Form.Item name="templateId" label="模板标识">
            <Input placeholder="例如：soft-portrait，用于初始化去重" maxLength={40} showCount />
          </Form.Item>

          <Form.Item name="desc" label="模板说明">
            <Input placeholder="一句话告诉用户适合什么场景" maxLength={50} showCount />
          </Form.Item>

          <Form.Item name="badge" label="角标">
            <Input placeholder="例如：女生最爱、热门、出片" maxLength={10} showCount />
          </Form.Item>

          <Form.Item
            name="prompt"
            label="提示词"
            rules={[{ required: true, message: '请输入提示词' }]}
          >
            <TextArea rows={5} placeholder="用户选择模板后会填入创作描述" maxLength={500} showCount />
          </Form.Item>

          <Form.Item
            name="ratio"
            label="默认比例"
            rules={[{ required: true, message: '请选择默认比例' }]}
          >
            <Select options={ratioOptions} />
          </Form.Item>

          <Form.Item name="style" label="默认风格">
            <Select
              allowClear
              showSearch
              placeholder="不选表示无风格"
              options={styleOptions}
            />
          </Form.Item>

          <Form.Item name="sort" label="排序（数字越小越靠前）">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="enabled" label="启用状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AIImageTemplatesPage;
