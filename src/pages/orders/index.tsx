import React, { useEffect, useState } from 'react';
import { Card, Table, Input, Select, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useAIImageOrderStore } from '@/stores/aiImageOrders';
import type { AIImageOrder } from '@/types';
import styles from './index.module.scss';

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '已支付', value: 'paid' },
  { label: '待支付', value: 'pending' },
  { label: '已退款', value: 'refunded' },
  { label: '失败', value: 'failed' },
];

function formatTime(value?: number) {
  return value ? new Date(value).toLocaleString() : '-';
}

function formatPrice(value?: number) {
  return `¥${Number(value || 0).toFixed(1)}`;
}

const Orders: React.FC = () => {
  const { orders, loading, total, fetchList } = useAIImageOrderStore();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('all');

  const loadData = async () => {
    await fetchList({ page, pageSize, keyword, status });
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
        const colorMap: Record<string, string> = {
          pending: 'default',
          paid: 'success',
          refunded: 'warning',
          failed: 'error',
        };
        const textMap: Record<string, string> = {
          pending: '待支付',
          paid: '已支付',
          refunded: '已退款',
          failed: '失败',
        };
        return <Tag color={colorMap[value] || 'default'}>{textMap[value] || value || '-'}</Tag>;
      },
    },
    {
      title: '支付',
      dataIndex: 'payType',
      key: 'payType',
      width: 100,
      render: (value: string) => <Tag color={value === 'mock' ? 'blue' : 'default'}>{value === 'mock' ? '模拟支付' : value || '-'}</Tag>,
    },
    {
      title: '支付时间',
      dataIndex: 'paidAt',
      key: 'paidAt',
      width: 180,
      render: (value: number, record: AIImageOrder) => formatTime(value || record.createdAt),
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
    </div>
  );
};

export default Orders;
