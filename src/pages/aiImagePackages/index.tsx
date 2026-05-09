import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
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
} from '@ant-design/icons';
import { useAIImagePackageStore } from '@/stores/aiImagePackages';
import type { AIImagePackage } from '@/types';
import styles from './index.module.scss';

function formatPrice(value?: number) {
  return `¥${Number(value || 0).toFixed(1)}`;
}

function normalizeDiscount(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 10;
  }

  return Math.min(10, Math.max(0.1, Math.round(value * 10) / 10));
}

function formatDiscount(value?: number) {
  return `${normalizeDiscount(value).toFixed(1)} 折`;
}

function getDiscountedPrice(price?: number, discount?: number) {
  const basePrice = Number(price || 0);
  return Number((basePrice * normalizeDiscount(discount) / 10).toFixed(1));
}

const AIImagePackagesPage: React.FC = () => {
  const {
    packages,
    loading,
    total,
    fetchList,
    create,
    update,
    delete: deletePackage,
    toggleEnabled,
    seedDefaults,
  } = useAIImagePackageStore();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<AIImagePackage | null>(null);
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    await fetchList({ page, pageSize, keyword });
  }, [fetchList, page, pageSize, keyword]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = () => {
    setEditingPackage(null);
    form.resetFields();
    form.setFieldsValue({
      packageId: 'standard-50',
      title: 'AI 生图 50 张',
      desc: '适合集中测试和日常创作，支付后立即到账。',
      badge: '推荐',
      price: 19.9,
      discount: 10,
      imageCount: 50,
      sort: total + 1,
      enabled: true,
    });
    setModalOpen(true);
  };

  const handleEdit = (record: AIImagePackage) => {
    setEditingPackage(record);
    form.setFieldsValue({
      ...record,
      discount: record.discount ?? 10,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const result = editingPackage && editingPackage._id
        ? await update(editingPackage._id, values)
        : await create(values);

      if (result.success) {
        message.success(result.message);
        setModalOpen(false);
        loadData();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Validate AI image package error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deletePackage(id);
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

  const columns = [
    {
      title: '套餐',
      key: 'title',
      render: (_: unknown, record: AIImagePackage) => (
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
      dataIndex: 'packageId',
      key: 'packageId',
      width: 140,
      render: (value: string) => value || '-',
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 130,
      render: (value: number, record: AIImagePackage) => {
        const discount = normalizeDiscount(record.discount);
        const discountedPrice = getDiscountedPrice(value, discount);

        return (
          <div>
            <div>{formatPrice(value)}</div>
            {discount < 10 && (
              <div className={styles.descText}>
                折后 {formatPrice(discountedPrice)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '折扣',
      dataIndex: 'discount',
      key: 'discount',
      width: 90,
      render: (value: number) => formatDiscount(value),
    },
    {
      title: '图片数',
      dataIndex: 'imageCount',
      key: 'imageCount',
      width: 100,
      render: (value: number) => `${value || 0} 张`,
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 80,
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 90,
      render: (enabled: boolean, record: AIImagePackage) => (
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
      render: (_: unknown, record: AIImagePackage) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个套餐？"
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
        <h1 className="page-title">AI 套餐管理</h1>
      </div>

      <Card>
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <Input.Search
              allowClear
              placeholder="搜索套餐标题"
              style={{ width: 240 }}
              onSearch={(value) => {
                setKeyword(value);
                setPage(1);
              }}
            />
          </div>
          <Space>
            <Popconfirm
              title="会追加默认套餐，确定初始化？"
              okText="确定"
              cancelText="取消"
              onConfirm={handleSeedDefaults}
            >
              <Button icon={<ReloadOutlined />}>初始化默认套餐</Button>
            </Popconfirm>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增套餐
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={packages}
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
        title={editingPackage ? '编辑 AI 套餐' : '新增 AI 套餐'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={680}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="packageId" label="套餐标识">
            <Input placeholder="例如：standard-50，用于初始化去重" maxLength={40} showCount />
          </Form.Item>

          <Form.Item
            name="title"
            label="套餐标题"
            rules={[{ required: true, message: '请输入套餐标题' }]}
          >
            <Input placeholder="例如：AI 生图 50 张" maxLength={30} showCount />
          </Form.Item>

          <Form.Item name="desc" label="套餐说明">
            <Input placeholder="一句话告诉用户适合什么场景" maxLength={60} showCount />
          </Form.Item>

          <Form.Item name="badge" label="角标">
            <Input placeholder="例如：推荐、限时" maxLength={10} showCount />
          </Form.Item>

          <Form.Item
            name="price"
            label="价格（元）"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <InputNumber min={0} precision={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="discount"
            label="折扣"
            rules={[{ required: true, message: '请输入折扣' }]}
          >
            <InputNumber min={0.1} max={10} step={0.1} precision={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="imageCount"
            label="图片数量"
            rules={[{ required: true, message: '请输入图片数量' }]}
          >
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
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

export default AIImagePackagesPage;
