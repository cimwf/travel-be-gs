import React, { useEffect, useState } from 'react';
import { Button, Card, Descriptions, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import { DeleteOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { useAIImageOrderStore } from '@/stores/aiImageOrders';
import type { AIImageOrder } from '@/types';
import styles from './index.module.scss';

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '已支付', value: 'paid' },
  { label: '待支付', value: 'pending_payment' },
  { label: '确认中/需核查', value: 'confirming_payment' },
  { label: '已退款', value: 'refunded' },
  { label: '失败', value: 'failed' },
];

const manualStatusOptions = [
  { label: '已支付', value: 'paid' },
  { label: '待支付', value: 'pending_payment' },
  { label: '确认中/需核查', value: 'confirming_payment' },
  { label: '已退款', value: 'refunded' },
  { label: '失败', value: 'failed' },
];

const statusMeta: Record<string, { color: string; text: string }> = {
  pending: { color: 'default', text: '待支付' },
  pending_payment: { color: 'default', text: '待支付' },
  confirming_payment: { color: 'processing', text: '确认中/需核查' },
  paid: { color: 'success', text: '已支付' },
  refunded: { color: 'warning', text: '已退款' },
  failed: { color: 'error', text: '失败' },
};

const payTypeMeta: Record<string, { color: string; text: string }> = {
  mock: { color: 'blue', text: '模拟支付' },
  virtual_sandbox: { color: 'orange', text: '虚拟支付沙箱' },
  virtual_live: { color: 'green', text: '虚拟支付现网' },
  iap: { color: 'purple', text: 'iOS IAP' },
};

// 微信虚拟支付订单类型，0=Android普通，7=iOS苹果IAP
function getOrderTypeLabel(orderType?: number): string | null {
  if (orderType === 7) return 'iOS IAP';
  if (orderType === 0) return null; // 普通虚拟支付，不额外标注
  if (typeof orderType === 'number') return `order_type=${orderType}`;
  return null;
}

function formatTime(value?: number) {
  return value ? new Date(value).toLocaleString() : '-';
}

function formatPrice(value?: number) {
  return `¥${Number(value || 0).toFixed(1)}`;
}

const Orders: React.FC = () => {
  const { orders, loading, total, fetchList, delete: deleteOrder, updateStatus } = useAIImageOrderStore();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('all');
  const [editingOrder, setEditingOrder] = useState<AIImageOrder | null>(null);
  const [editingStatus, setEditingStatus] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  const loadData = async () => {
    await fetchList({ page, pageSize, keyword, status });
  };

  const handleDelete = async (id?: string) => {
    if (!id) {
      message.error('订单 ID 不存在，无法删除');
      return;
    }

    const result = await deleteOrder(id);
    if (result.success) {
      message.success(result.message);
      await loadData();
    } else {
      message.error(result.message);
    }
  };

  const openEditModal = (record: AIImageOrder) => {
    setEditingOrder(record);
    setEditingStatus(record.status || 'pending_payment');
  };

  const closeEditModal = () => {
    if (savingStatus) return;
    setEditingOrder(null);
    setEditingStatus('');
  };

  const handleSaveStatus = async () => {
    if (!editingOrder?._id) {
      message.error('订单 ID 不存在，无法修改状态');
      return;
    }

    setSavingStatus(true);
    try {
      const result = await updateStatus(editingOrder._id, editingStatus);
      if (result.success) {
        message.success(result.message);
        setEditingOrder(null);
        setEditingStatus('');
        await loadData();
      } else {
        message.error(result.message);
      }
    } finally {
      setSavingStatus(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, keyword, status]);

  const columns = [
    {
      title: '订单',
      key: 'order',
      width: 220,
      render: (_: unknown, record: AIImageOrder) => (
        <div>
          <strong className={styles.mono}>{record.orderNo || record._id || '-'}</strong>
          <div className={styles.muted}>{record.packageKey || '-'}</div>
        </div>
      ),
    },
    {
      title: '用户',
      key: 'user',
      width: 260,
      render: (_: unknown, record: AIImageOrder) => (
        <div>
          <strong>{record.nickname || '未同步昵称'}</strong>
          <div className={styles.muted}>{record.phoneMask || record.phone || '未绑定手机号'}</div>
          <div className={styles.muted}>{record.appUserId ? `用户ID：${record.appUserId}` : '用户ID：-'}</div>
          <div className={styles.openidText}>{record.userId || '-'}</div>
        </div>
      ),
    },
    {
      title: '套餐',
      key: 'package',
      render: (_: unknown, record: AIImageOrder) => (
        <div>
          <strong>{record.title || '-'}</strong>
          <div className={styles.muted}>{record.imageCount || 0} 张图</div>
        </div>
      ),
    },
    {
      title: '金额',
      dataIndex: 'price',
      key: 'price',
      width: 90,
      render: (value: number) => <span className={styles.amount}>{formatPrice(value)}</span>,
    },
    {
      title: '额度变化',
      key: 'quota',
      width: 150,
      render: (_: unknown, record: AIImageOrder) => (
        <div className={styles.quotaText}>
          <span>{record.beforeRemaining ?? 0}</span>
          <span>→</span>
          <span>{record.afterRemaining ?? record.imageCount ?? 0}</span>
          <div className={styles.muted}>剩余次数</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value: string) => {
        const meta = statusMeta[value] || { color: 'default', text: value || '-' };
        return <Tag color={meta.color}>{meta.text}</Tag>;
      },
    },
    {
      title: '支付',
      dataIndex: 'payType',
      key: 'payType',
      width: 130,
      render: (value: string, record: AIImageOrder) => {
        const orderTypeLabel = getOrderTypeLabel(record.orderType);
        // iOS IAP 订单优先用 IAP 标签展示
        const meta = orderTypeLabel === 'iOS IAP'
          ? payTypeMeta.iap
          : (payTypeMeta[value] || { color: 'default', text: value || '-' });
        return (
          <div>
            <Tag color={meta.color}>{meta.text}</Tag>
            {orderTypeLabel && orderTypeLabel !== 'iOS IAP' && (
              <Tag color="default" style={{ marginTop: 2 }}>{orderTypeLabel}</Tag>
            )}
            {typeof record.payEnv === 'number' && orderTypeLabel !== 'iOS IAP' && (
              <div className={styles.muted}>{record.payEnv === 0 ? '现网' : '沙箱'}</div>
            )}
            {orderTypeLabel === 'iOS IAP' && (
              <div className={styles.muted}>结算走 Apple</div>
            )}
          </div>
        );
      },
    },
    {
      title: '支付时间',
      dataIndex: 'paidAt',
      key: 'paidAt',
      width: 180,
      render: (value: number, record: AIImageOrder) => formatTime(value || record.confirmingAt || record.createdAt),
    },
    {
      title: '操作',
      key: 'action',
      width: 130,
      fixed: 'right' as const,
      render: (_: unknown, record: AIImageOrder) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个订单？"
            description="删除后仅移除后台订单记录，不会自动退款，也不会回滚用户额度。"
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record._id)}
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
        <h1 className="page-title">订单管理</h1>
      </div>

      <Card>
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <Input.Search
              allowClear
              placeholder="搜索订单号 / 昵称 / 手机号 / openid / 用户ID"
              style={{ width: 360 }}
              prefix={<SearchOutlined />}
              onSearch={(value) => {
                setKeyword(value);
                setPage(1);
              }}
            />
            <Select
              value={status}
              style={{ width: 120 }}
              options={statusOptions}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey={(record) => record._id || record.orderNo || `${record.userId}_${record.createdAt || ''}`}
          loading={loading}
          scroll={{ x: 1360 }}
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
        title="编辑订单"
        open={Boolean(editingOrder)}
        onOk={handleSaveStatus}
        onCancel={closeEditModal}
        confirmLoading={savingStatus}
        okText="保存"
        cancelText="取消"
      >
        {editingOrder && (
          <>
            <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="订单号">{editingOrder.orderNo || '-'}</Descriptions.Item>
              <Descriptions.Item label="用户">{editingOrder.nickname || editingOrder.userId || '-'}</Descriptions.Item>
              <Descriptions.Item label="套餐">{editingOrder.title || '-'}</Descriptions.Item>
              <Descriptions.Item label="金额">{formatPrice(editingOrder.price)}</Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag color={statusMeta[editingOrder.status]?.color || 'default'}>
                  {statusMeta[editingOrder.status]?.text || editingOrder.status || '-'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            <div>
              <div className={styles.muted} style={{ marginBottom: 8 }}>
                修改订单状态不会自动退款，也不会自动加/扣用户次数。请先确认额度已手动处理。
              </div>
              <Select
                value={editingStatus}
                options={manualStatusOptions}
                style={{ width: '100%' }}
                onChange={setEditingStatus}
              />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Orders;
