import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Space, Popconfirm, message, Image, Tag } from 'antd';
import { SearchOutlined, DeleteOutlined, CheckCircleOutlined, ExportOutlined, ReloadOutlined } from '@ant-design/icons';
import { useUserSpotsStore } from '@/stores/userSpots';
import type { UserSpot } from '@/stores/userSpots';
import styles from './index.module.scss';

const UserSpots: React.FC = () => {
  const { fetchList, approve, delete: deleteSpot, moveToQuickAttractions, spots, total, loading } = useUserSpotsStore();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');

  const loadData = () => {
    fetchList({ page, pageSize, keyword });
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, keyword]);

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  const handleApprove = async (id: string) => {
    const result = await approve(id);
    if (result.success) {
      message.success(result.message);
      loadData();
    } else {
      message.error(result.message);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteSpot(id);
    if (result.success) {
      message.success(result.message);
      loadData();
    } else {
      message.error(result.message);
    }
  };

  const handleMoveToQuick = async (record: UserSpot) => {
    const result = await moveToQuickAttractions(record._id!, record);
    if (result.success) {
      message.success(result.message);
      loadData();
    } else {
      message.error(result.message);
    }
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'processing', text: '待审核' },
    approved: { color: 'success', text: '已通过' },
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
      dataIndex: 'placeName',
      key: 'placeName',
      width: 180,
    },
    {
      title: '所在地区',
      dataIndex: 'location',
      key: 'location',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => {
        const info = statusMap[v] || { color: 'default', text: v };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (v: number) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: unknown, record: UserSpot) => (
        <Space size="small">
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleApprove(record._id!)}
            >
              审核通过
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<ExportOutlined />}
            onClick={() => handleMoveToQuick(record)}
          >
            上线
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
        <h1 className="page-title">用户上传景点</h1>
      </div>

      <Card>
        <div className={styles.toolbar}>
          <Input.Search
            placeholder="搜索景点名称"
            allowClear
            onSearch={handleSearch}
            style={{ width: 280 }}
            prefix={<SearchOutlined />}
          />
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            刷新
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={spots}
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

export default UserSpots;
