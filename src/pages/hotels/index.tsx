import React from 'react';
import { Card, Table, Button, Input, Select, Tag, Space } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import styles from './index.module.scss';

const Hotels: React.FC = () => {
  const columns = [
    { title: '酒店名称', dataIndex: 'name', key: 'name' },
    { title: '区域', dataIndex: 'district', key: 'district' },
    { title: '星级', dataIndex: 'star', key: 'star' },
    { title: '价格区间', dataIndex: 'price', key: 'price' },
    { title: '评分', dataIndex: 'rating', key: 'rating' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (value: string) => {
        const colorMap: Record<string, string> = {
          online: 'success',
          pending: 'warning',
          offline: 'error',
        };
        const textMap: Record<string, string> = {
          online: '已上线',
          pending: '待审核',
          offline: '已下线',
        };
        return <Tag color={colorMap[value]}>{textMap[value]}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: () => <Space><Button type="link" size="small">编辑</Button></Space>,
    },
  ];

  return (
    <div className={styles.container}>
      <div className="page-header">
        <h1 className="page-title">酒店管理</h1>
      </div>

      <Card>
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <Input.Search placeholder="搜索酒店名称" style={{ width: 280 }} prefix={<SearchOutlined />} />
            <Select style={{ width: 120 }} placeholder="全部状态" />
          </div>
          <Button type="primary" icon={<PlusOutlined />}>新增酒店</Button>
        </div>

        <Table columns={columns} dataSource={[]} rowKey="id" />
      </Card>
    </div>
  );
};

export default Hotels;
