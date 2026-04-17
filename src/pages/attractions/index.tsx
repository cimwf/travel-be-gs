import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Select, Tag, Space, Popconfirm, message, Image } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, UpOutlined, DownOutlined, SyncOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAttractionsStore } from '@/stores/attractions';
import { categoryOptions, locationOptions } from '@/mock/attractions';
import type { Attraction } from '@/types';
import styles from './index.module.scss';

const difficultyColorMap: Record<string, string> = {
  '简单': 'success',
  '中等': 'warning',
  '困难': 'error',
};

const AttractionsList: React.FC = () => {
  const navigate = useNavigate();
  const { fetchList, delete: deleteAttraction, updateSortOrder, initSortOrder } = useAttractionsStore();

  const [data, setData] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [location, setLocation] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchList({ page, pageSize, keyword, category, location });
      setData(result.list);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, keyword, category, location]);

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteAttraction(id);
    if (result.success) {
      message.success(result.message);
      loadData();
    } else {
      message.error(result.message);
    }
  };

  const handleMoveUp = async (record: Attraction) => {
    const currentIndex = data.findIndex(item => item._id === record._id);
    if (currentIndex <= 0) return;

    const prevItem = data[currentIndex - 1];

    // 使用临时值避免冲突：先设成一个大负数
    await updateSortOrder(record._id!, -1000);
    await updateSortOrder(prevItem._id!, record.sortOrder);
    await updateSortOrder(record._id!, prevItem.sortOrder);

    message.success('上移成功');
    loadData();
  };

  const handleMoveDown = async (record: Attraction) => {
    const currentIndex = data.findIndex(item => item._id === record._id);
    if (currentIndex >= data.length - 1) return;

    const nextItem = data[currentIndex + 1];

    // 使用临时值避免冲突：先设成一个大数
    await updateSortOrder(record._id!, 10000);
    await updateSortOrder(nextItem._id!, record.sortOrder);
    await updateSortOrder(record._id!, nextItem.sortOrder);

    message.success('下移成功');
    loadData();
  };

  const handleInitSortOrder = async () => {
    const result = await initSortOrder();
    if (result.success) {
      message.success(result.message);
      loadData();
    } else {
      message.error(result.message);
    }
  };

  const columns = [
    {
      title: '封面',
      dataIndex: 'coverImage',
      key: 'coverImage',
      width: 100,
      render: (url: string) => (
        <Image
          src={url}
          width={80}
          height={60}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        />
      ),
    },
    {
      title: '景点名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 80,
    },
    {
      title: '区域',
      dataIndex: 'location',
      key: 'location',
      width: 100,
    },
    {
      title: '距离',
      dataIndex: 'distance',
      key: 'distance',
      width: 80,
      render: (v: number) => `${v}km`,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 80,
      render: (v: string) => (
        <Tag color={difficultyColorMap[v] || 'default'}>{v}</Tag>
      ),
    },
    {
      title: '想去/访问',
      key: 'counts',
      width: 120,
      render: (_: unknown, record: Attraction) => (
        <span>
          {record.wantCount}/{record.visitCount}
        </span>
      ),
    },
    {
      title: '最佳季节',
      dataIndex: 'bestSeason',
      key: 'bestSeason',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      render: (_: unknown, record: Attraction, index: number) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<UpOutlined />}
            disabled={index === 0}
            onClick={() => handleMoveUp(record)}
          >
            上移
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DownOutlined />}
            disabled={index === data.length - 1}
            onClick={() => handleMoveDown(record)}
          >
            下移
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/attractions/edit/${record._id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此景点吗？"
            onConfirm={() => handleDelete(record._id!)}
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
              style={{ width: 120 }}
              options={[
                { value: 'all', label: '全部分类' },
                ...categoryOptions,
              ]}
            />
            <Select
              value={location}
              onChange={setLocation}
              style={{ width: 120 }}
              options={[
                { value: 'all', label: '全部区域' },
                ...locationOptions.map((l) => ({ value: l, label: l })),
              ]}
            />
          </div>
          <Space>
            <Popconfirm
              title="初始化排序将按创建时间为所有景点重新排序，确定执行吗？"
              onConfirm={handleInitSortOrder}
              okText="确定"
              cancelText="取消"
            >
              <Button icon={<SyncOutlined />}>
                初始化排序
              </Button>
            </Popconfirm>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/attractions/create')}
            >
              新增景点
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data}
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
    </div>
  );
};

export default AttractionsList;
