import React, { useState, useEffect } from 'react';
import { Card, Table, Input, Space, Button, Avatar, Tag, Modal, message } from 'antd';
import { SearchOutlined, ManOutlined, WomanOutlined } from '@ant-design/icons';
import { useUsersStore, type UserItem } from '@/stores/users';
import styles from './index.module.scss';

const Users: React.FC = () => {
  const { users, loading, total, fetchList } = useUsersStore();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserItem | null>(null);

  useEffect(() => {
    fetchList({ page, pageSize, keyword });
  }, [page, pageSize]);

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
    fetchList({ page: 1, pageSize, keyword: value });
  };

  const handleViewDetail = (record: UserItem) => {
    setCurrentUser(record);
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
      width: 180,
      render: (_: unknown, record: UserItem) => (
        <Space>
          <Avatar src={record.avatar} size="small">
            {record.nickname?.charAt(0) || '用'}
          </Avatar>
          <span>{record.nickname || '未设置'}</span>
          {record.gender === 'male' ? (
            <ManOutlined style={{ color: '#1890ff' }} />
          ) : record.gender === 'female' ? (
            <WomanOutlined style={{ color: '#eb2f96' }} />
          ) : null}
        </Space>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phoneMask',
      key: 'phoneMask',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '简介',
      dataIndex: 'bio',
      key: 'bio',
      width: 150,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '关注/粉丝',
      key: 'follow',
      width: 100,
      render: (_: unknown, record: UserItem) => (
        <span>
          {record.following || 0}/{record.followers || 0}
        </span>
      ),
    },
    {
      title: '行程/去过',
      key: 'trips',
      width: 100,
      render: (_: unknown, record: UserItem) => (
        <span>
          {record.trips || 0}/{record.places || 0}
        </span>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (value: number) => formatTime(value),
    },
    {
      title: '最后活跃',
      dataIndex: 'lastActiveAt',
      key: 'lastActiveAt',
      width: 160,
      render: (value: number) => formatTime(value),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: UserItem) => (
        <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
          查看详情
        </Button>
      ),
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
            <Input.Search
              placeholder="搜索用户昵称"
              style={{ width: 280 }}
              prefix={<SearchOutlined />}
              onSearch={handleSearch}
              allowClear
            />
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={users}
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

      {/* 用户详情弹窗 */}
      <Modal
        title="用户详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {currentUser && (
          <div className={styles.detail}>
            <div className={styles.detailHeader}>
              <Avatar src={currentUser.avatar} size={64}>
                {currentUser.nickname?.charAt(0) || '用'}
              </Avatar>
              <div className={styles.detailInfo}>
                <div className={styles.nickname}>
                  {currentUser.nickname || '未设置'}
                  {currentUser.gender === 'male' ? (
                    <ManOutlined style={{ color: '#1890ff', marginLeft: 8 }} />
                  ) : currentUser.gender === 'female' ? (
                    <WomanOutlined style={{ color: '#eb2f96', marginLeft: 8 }} />
                  ) : null}
                </div>
                <div className={styles.bio}>{currentUser.bio || '暂无简介'}</div>
              </div>
            </div>

            <div className={styles.detailItem}>
              <label>用户 ID：</label>
              <span>{currentUser._id}</span>
            </div>
            <div className={styles.detailItem}>
              <label>手机号：</label>
              <span>{currentUser.phone || '未绑定'}</span>
            </div>
            <div className={styles.detailItem}>
              <label>关注/粉丝：</label>
              <span>{currentUser.following || 0} / {currentUser.followers || 0}</span>
            </div>
            <div className={styles.detailItem}>
              <label>行程/去过：</label>
              <span>{currentUser.trips || 0} / {currentUser.places || 0}</span>
            </div>
            <div className={styles.detailItem}>
              <label>车主认证：</label>
              <span>{currentUser.carOwner ? '已认证' : '未认证'}</span>
            </div>
            <div className={styles.detailItem}>
              <label>标签：</label>
              <span>
                {currentUser.tags && currentUser.tags.length > 0
                  ? currentUser.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)
                  : '无标签'}
              </span>
            </div>
            <div className={styles.detailItem}>
              <label>相册：</label>
              <span>{currentUser.photos?.length || 0} 张照片</span>
            </div>
            <div className={styles.detailItem}>
              <label>注册时间：</label>
              <span>{formatTime(currentUser.createdAt)}</span>
            </div>
            <div className={styles.detailItem}>
              <label>最后活跃：</label>
              <span>{formatTime(currentUser.lastActiveAt)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Users;
