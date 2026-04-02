import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Select, Tag, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAttractionsStore } from '@/stores/attractions';
import type { Attraction } from '@/types';
import styles from './index.module.scss';

const statusMap: Record<string, { color: string; text: string }> = {
  online: { color: 'success', text: '已上线' },
  pending: { color: 'warning', text: '待审核' },
  offline: { color: 'error', text: '已下线' },
};

const difficultyMap: Record<string, { color: string; text: string }> = {
  easy: { color: 'success', text: '简单' },
  medium: { color: 'warning', text: '中等' },
  hard: { color: 'error', text: '困难' },
};

const AttractionsList: React.FC = () => {
  const navigate = useNavigate();
  const { attractions, total, loading, fetchList, delete: deleteAttraction } = useAttractionsStore();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    fetchList({ page, pageSize, keyword, category, status });
  }, [page, pageSize, keyword, category, status]);

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteAttraction(id);
    if (success) {
      message.success('删除成功');
      fetchList({ page, pageSize, keyword, category, status });
    }
  };

  const columns = [
    {
      title: '景点名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '区域',
      dataIndex: 'district',
      key: 'district',
      width: 100,
    },
    {
      title: '票价',
      key: 'price',
      width: 100,
      render: (_: unknown, record: Attraction) => {
        const adultTicket = record.tickets.find((t) => t.type === '成人票');
        return adultTicket ? `¥${adultTicket.price}` : '-';
      },
    },
    {
      title: '浏览量',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 100,
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value: string) => {
        const { color, text } = statusMap[value] || { color: 'default', text: value };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: Attraction) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/attractions/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此景点吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
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
        <h1 className="page-title">景点管理</h1>
      </div>

      <Card>
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <Input.Search
              placeholder="搜索景点名称"
              allowClear
              onSearch={handleSearch}
              style={{ width: 280 }}
              prefix={<SearchOutlined />}
            />
            <Select
              value={category}
              onChange={setCategory}
              style={{ width: 140 }}
              options={[
                { value: 'all', label: '全部分类' },
                { value: '历史古迹', label: '历史古迹' },
                { value: '自然风光', label: '自然风光' },
                { value: '主题公园', label: '主题公园' },
                { value: '博物馆', label: '博物馆' },
              ]}
            />
            <Select
              value={status}
              onChange={setStatus}
              style={{ width: 120 }}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'online', label: '已上线' },
                { value: 'pending', label: '待审核' },
                { value: 'offline', label: '已下线' },
              ]}
            />
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/attractions/create')}
          >
            新增景点
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={attractions}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            },
          }}
        />
      </Card>
    </div>
  );
};

export default AttractionsList;
