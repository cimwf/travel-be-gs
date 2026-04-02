import React from 'react';
import { Card, Table, Input, Select, Space, Button, Avatar, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import styles from './index.module.scss';

const Users: React.FC = () => {
  const columns = [
    {
      title: '用户',
      key: 'user',
      render: () => (
        <Space>
          <Avatar style={{ backgroundColor: 'var(--primary-100)', color: 'var(--primary-600)' }}>张</Avatar>
          <span>张三</span>
        </Space>
      ),
    },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '订单数', dataIndex: 'orderCount', key: 'orderCount' },
    { title: '消费金额', dataIndex: 'totalSpent', key: 'totalSpent', render: (v: number) => `¥${v}` },
    { title: '注册时间', dataIndex: 'createdAt', key: 'createdAt' },
    { title: '最后登录', dataIndex: 'lastLoginAt', key: 'lastLoginAt' },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => tags?.map((tag) => <Tag key={tag}>{tag}</Tag>),
    },
    {
      title: '操作',
      key: 'action',
      render: () => <Button type="link" size="small">查看详情</Button>,
    },
  ];

  return (
    <div className={styles.container}>
      <div className="page-header">
        <h1 className="page-title">用户管理</h1>
      </div>

      <Card>
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <Input.Search placeholder="搜索用户昵称/手机号" style={{ width: 280 }} prefix={<SearchOutlined />} />
            <Select style={{ width: 120 }} placeholder="用户标签" />
          </div>
        </div>

        <Table columns={columns} dataSource={[]} rowKey="id" />
      </Card>
    </div>
  );
};

export default Users;
