import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Table,
  Tag,
  message,
} from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useAIImageQuotaStore } from '@/stores/aiImageQuotas';
import type { AIImageQuota } from '@/types';
import styles from './index.module.scss';

const AIImageQuotasPage: React.FC = () => {
  const { quotas, loading, total, fetchList, updateTotal, create } = useAIImageQuotaStore();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuota, setEditingQuota] = useState<AIImageQuota | null>(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    await fetchList({ page, pageSize, keyword });
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, keyword]);

  const handleEdit = (record: AIImageQuota) => {
    setEditingQuota(record);
    form.setFieldsValue({
      userId: record.userId,
      appUserId: record.appUserId,
      nickname: record.nickname,
      phone: record.phone,
      phoneMask: record.phoneMask,
      total: record.total,
      used: record.used || 0,
    });
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingQuota(null);
    form.resetFields();
    form.setFieldsValue({
      total: 3,
      used: 0,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const result = editingQuota && editingQuota._id
        ? await updateTotal(editingQuota._id, values.total, values.used)
        : await create(values);

      if (result.success) {
        message.success(result.message);
        setModalOpen(false);
        loadData();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Validate AI image quota error:', error);
    }
  };

  const columns = [
    {
      title: '用户信息',
      key: 'userInfo',
      width: 260,
      render: (_: unknown, record: AIImageQuota) => (
        <div>
          <strong>{record.nickname || '未同步昵称'}</strong>
          <div className={styles.muted}>{record.phoneMask || record.phone || '未绑定手机号'}</div>
          <div className={styles.muted}>{record.appUserId ? `用户ID：${record.appUserId}` : '用户ID：-'}</div>
        </div>
      ),
    },
    {
      title: 'openid',
      dataIndex: 'userId',
      key: 'userId',
      width: 220,
      render: (value: string) => (
        <div>
          <span className={styles.openidText}>{value || '-'}</span>
        </div>
      ),
    },
    {
      title: '总额度 total',
      dataIndex: 'total',
      key: 'total',
      width: 140,
      render: (value: number) => <Tag color="blue">{value || 0} 次</Tag>,
    },
    {
      title: '已用 used',
      dataIndex: 'used',
      key: 'used',
      width: 120,
      render: (value: number) => (
        <div>
          <span>{value || 0} 次</span>
          <div className={styles.muted}>当前额度</div>
        </div>
      ),
    },
    {
      title: '剩余',
      key: 'remaining',
      width: 120,
      render: (_: unknown, record: AIImageQuota) => `${Math.max(0, (record.total || 0) - (record.used || 0))} 次`,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (value: number) => value ? new Date(value).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: AIImageQuota) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
          修改 total
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className="page-header">
        <h1 className="page-title">AI 额度管理</h1>
      </div>

      <Card>
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <Input.Search
              allowClear
              placeholder="搜索昵称 / 手机号 / openid / 用户ID"
              style={{ width: 340 }}
              onSearch={(value) => {
                setKeyword(value);
                setPage(1);
              }}
            />
          </div>
          <Popconfirm
            title="通常额度会由小程序首次访问自动创建，确定手动新增？"
            okText="新增"
            cancelText="取消"
            onConfirm={handleAdd}
          >
            <Button type="primary" icon={<PlusOutlined />}>
              新增额度
            </Button>
          </Popconfirm>
        </div>

        <Table
          columns={columns}
          dataSource={quotas}
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
        title={editingQuota ? '修改 AI 额度' : '新增 AI 额度'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={560}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="userId"
            label="用户 openid / userId / 手机号"
            rules={[{ required: true, message: '请输入用户 openid / userId / 手机号' }]}
          >
            <Input disabled={Boolean(editingQuota)} placeholder="输入任意一个，系统会优先从用户表补齐昵称和手机号" />
          </Form.Item>

          <Form.Item name="nickname" label="昵称">
            <Input disabled={Boolean(editingQuota)} placeholder="未匹配到用户时可手动填写" maxLength={30} />
          </Form.Item>

          <Form.Item name="phone" label="手机号">
            <Input disabled={Boolean(editingQuota)} placeholder="未匹配到用户时可手动填写" maxLength={20} />
          </Form.Item>

          <Form.Item name="appUserId" label="用户ID">
            <Input disabled={Boolean(editingQuota)} placeholder="用户表里的 userId，例如 BJxxxx" maxLength={40} />
          </Form.Item>

          <Form.Item
            name="total"
            label="总额度 total"
            rules={[{ required: true, message: '请输入总额度' }]}
          >
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="used" label="已用 used">
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AIImageQuotasPage;
