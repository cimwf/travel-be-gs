import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button, Select, Modal, message, Avatar } from 'antd';
import { useFeedbackStore } from '@/stores/feedback';
import styles from './index.module.scss';

const Feedback: React.FC = () => {
  const { feedbacks, loading, total, fetchList, updateStatus } = useFeedbackStore();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<typeof feedbacks[0] | null>(null);

  useEffect(() => {
    fetchList({ page, pageSize, status: statusFilter });
  }, [page, pageSize, statusFilter]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const result = await updateStatus(id, newStatus);
    if (result.success) {
      message.success(result.message);
      fetchList({ page, pageSize, status: statusFilter });
    } else {
      message.error(result.message);
    }
  };

  const handleViewDetail = (record: typeof feedbacks[0]) => {
    setCurrentFeedback(record);
    setDetailVisible(true);
  };

  const formatTime = (timestamp: number) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN');
  };

  const columns = [
    {
      title: '用户',
      key: 'user',
      width: 150,
      render: (_: unknown, record: typeof feedbacks[0]) => (
        <Space>
          <Avatar
            src={record.userInfo?.avatar}
            size="small"
          >
            {record.userInfo?.nickname?.charAt(0) || '用'}
          </Avatar>
          <span>{record.userInfo?.nickname || '未知用户'}</span>
        </Space>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 150,
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      width: 200,
    },
    {
      title: '联系方式',
      dataIndex: 'contact',
      key: 'contact',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'warning', text: '待处理' },
          processing: { color: 'processing', text: '处理中' },
          resolved: { color: 'success', text: '已解决' },
        };
        const { color, text } = statusMap[value] || { color: 'default', text: value };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (value: number) => formatTime(value),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: unknown, record: typeof feedbacks[0]) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
            查看
          </Button>
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              onClick={() => handleStatusChange(record._id, 'processing')}
            >
              开始处理
            </Button>
          )}
          {record.status === 'processing' && (
            <Button
              type="link"
              size="small"
              onClick={() => handleStatusChange(record._id, 'resolved')}
            >
              标记完成
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className="page-header">
        <h1 className="page-title">用户反馈</h1>
      </div>

      <Card>
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <Select
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              style={{ width: 120 }}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'pending', label: '待处理' },
                { value: 'processing', label: '处理中' },
                { value: 'resolved', label: '已解决' },
              ]}
            />
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={feedbacks}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      {/* 详情弹窗 */}
      <Modal
        title="反馈详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {currentFeedback && (
          <div className={styles.detail}>
            <div className={styles.detailItem}>
              <label>用户：</label>
              <Space>
                <Avatar src={currentFeedback.userInfo?.avatar} size="small">
                  {currentFeedback.userInfo?.nickname?.charAt(0) || '用'}
                </Avatar>
                <span>{currentFeedback.userInfo?.nickname || '未知用户'}</span>
              </Space>
            </div>
            <div className={styles.detailItem}>
              <label>标题：</label>
              <span>{currentFeedback.title}</span>
            </div>
            <div className={styles.detailItem}>
              <label>内容：</label>
              <p>{currentFeedback.content}</p>
            </div>
            <div className={styles.detailItem}>
              <label>联系方式：</label>
              <span>{currentFeedback.contact || '未提供'}</span>
            </div>
            <div className={styles.detailItem}>
              <label>状态：</label>
              <Select
                value={currentFeedback.status}
                onChange={(value) => {
                  handleStatusChange(currentFeedback._id, value);
                  setCurrentFeedback({ ...currentFeedback, status: value as typeof currentFeedback.status });
                }}
                style={{ width: 120 }}
                options={[
                  { value: 'pending', label: '待处理' },
                  { value: 'processing', label: '处理中' },
                  { value: 'resolved', label: '已解决' },
                ]}
              />
            </div>
            <div className={styles.detailItem}>
              <label>创建时间：</label>
              <span>{formatTime(currentFeedback.createdAt)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Feedback;
