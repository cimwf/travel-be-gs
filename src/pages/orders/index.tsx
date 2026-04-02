import React from 'react';
import { Card, Table, Button, Input, Select, Tag, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import styles from './index.module.scss';

const Orders: React.FC = () => {
  const columns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo' },
    { title: '用户', dataIndex: 'userName', key: 'userName' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '项目', dataIndex: 'itemName', key: 'itemName' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: number) => `¥${v}` },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (value: string) => {
        const colorMap: Record<string, string> = {
          pending: 'default',
          paid: 'processing',
          completed: 'success',
          refunded: 'warning',
          cancelled: 'error',
        };
        const textMap: Record<string, string> = {
          pending: '待支付',
          paid: '已支付',
          completed: '已完成',
          refunded: '已退款',
          cancelled: '已取消',
        };
        return <Tag color={colorMap[value]}>{textMap[value]}</Tag>;
      },
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作',
      key: 'action',
      render: () => <Space><Button type="link" size="small">查看</Button></Space>,
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
            <Input.Search placeholder="搜索订单号/用户" style={{ width: 280 }} prefix={<SearchOutlined />} />
            <Select style={{ width: 120 }} placeholder="全部状态" />
            <Select style={{ width: 120 }} placeholder="全部类型" />
          </div>
        </div>

        <Table columns={columns} dataSource={[]} rowKey="id" />
      </Card>
    </div>
  );
};

export default Orders;
