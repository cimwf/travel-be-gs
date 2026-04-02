import React from 'react';
import { Card, Table, Tag, Space, Button, Select } from 'antd';
import styles from './index.module.scss';

const Feedback: React.FC = () => {
  const columns = [
    { title: '用户', dataIndex: 'userName', key: 'userName' },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (value: string) => {
        const typeMap: Record<string, { color: string; text: string }> = {
          consult: { color: 'blue', text: '咨询' },
          complaint: { color: 'red', text: '投诉' },
          suggestion: { color: 'green', text: '建议' },
        };
        const { color, text } = typeMap[value] || { color: 'default', text: value };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (value: string) => {
        const priorityMap: Record<string, { color: string; text: string }> = {
          low: { color: 'default', text: '低' },
          medium: { color: 'warning', text: '中' },
          high: { color: 'error', text: '高' },
        };
        const { color, text } = priorityMap[value] || { color: 'default', text: value };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
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
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" size="small">处理</Button>
          <Button type="link" size="small">查看</Button>
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
            <Select style={{ width: 120 }} placeholder="全部类型" />
            <Select style={{ width: 120 }} placeholder="全部状态" />
            <Select style={{ width: 120 }} placeholder="全部优先级" />
          </div>
        </div>

        <Table columns={columns} dataSource={[]} rowKey="id" />
      </Card>
    </div>
  );
};

export default Feedback;
