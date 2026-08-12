import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Avatar, Button, Card, Descriptions, Empty, Image, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/auth';
import { useTripReviewStore, type TripReviewFilter, type TripReviewItem, type TripReviewStatus } from '@/stores/tripReviews';
import styles from './index.module.scss';

const statusOptions = [
  { value: 'all', label: '全部行程' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '不通过' },
];

function formatTime(value?: number) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-';
}

function getImages(trip: TripReviewItem) {
  const urls = [
    trip.customCoverImageObject?.url,
    trip.customCoverImageUrl,
    trip.customCoverImage,
    ...(trip.coverImageObjects || []).map((item) => item.url),
    ...(trip.coverImageUrls || []),
    ...(trip.coverImages || []),
  ].filter((item): item is string => !!item && !item.startsWith('cloud://'));
  return Array.from(new Set(urls));
}

const TripReviews: React.FC = () => {
  const { trips, total, loading, error, fetchList, review } = useTripReviewStore();
  const adminUser = useAuthStore((state) => state.user);
  const adminId = adminUser?.id || '';
  const reviewerName = adminUser?.nickname || adminUser?.username || '管理员';
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reviewStatus, setReviewStatus] = useState<TripReviewFilter>('all');
  const [current, setCurrent] = useState<TripReviewItem | null>(null);
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(
    () => fetchList({ adminId, page, pageSize, reviewStatus }),
    [adminId, fetchList, page, pageSize, reviewStatus],
  );

  useEffect(() => { loadData(); }, [loadData]);

  const submitReview = async (decision: TripReviewStatus) => {
    if (!current) return;
    setSubmitting(true);
    try {
      const result = await review({ adminId, tripId: current._id, decision, remark, reviewerName });
      if (!result.success) return void message.error(result.message);
      message.success(result.message);
      setCurrent(null);
      setRemark('');
      if (trips.length === 1 && page > 1) setPage(page - 1);
      else await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(() => [
    {
      title: '发起人', key: 'creator', width: 190,
      render: (_: unknown, item: TripReviewItem) => (
        <Space>
          <Avatar src={item.creatorAvatar || undefined} icon={!item.creatorAvatar ? <UserOutlined /> : undefined} />
          <div><div>{item.creatorName || '旅行者'}</div><div className={styles.muted}>{item.creatorId || '-'}</div></div>
        </Space>
      ),
    },
    { title: '行程', key: 'title', ellipsis: true, render: (_: unknown, item: TripReviewItem) => item.tripTitle || item.placeName || '未命名行程' },
    { title: '出发地', dataIndex: 'departure', key: 'departure', width: 130, ellipsis: true },
    { title: '出发日期', dataIndex: 'date', key: 'date', width: 120, render: (value?: string) => value || '-' },
    {
      title: '封面', key: 'covers', width: 150,
      render: (_: unknown, item: TripReviewItem) => {
        const images = getImages(item).slice(0, 2);
        return images.length ? <Image.PreviewGroup><Space size={4}>{images.map((url) => <Image key={url} src={url} width={52} height={52} className={styles.cover} />)}</Space></Image.PreviewGroup> : '-';
      },
    },
    { title: '审核状态', dataIndex: 'reviewStatus', key: 'reviewStatus', width: 100, render: (value: TripReviewStatus) => <Tag color={value === 'rejected' ? 'error' : 'success'}>{value === 'rejected' ? '不通过' : '已通过'}</Tag> },
    { title: '发布时间', dataIndex: 'createdAt', key: 'createdAt', width: 180, render: formatTime },
    { title: '操作', key: 'action', width: 110, fixed: 'right' as const, render: (_: unknown, item: TripReviewItem) => <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setCurrent(item); setRemark(item.adminReviewRemark || ''); }}>查看审核</Button> },
  ], []);

  const images = current ? getImages(current) : [];
  return (
    <div className={styles.container}>
      <div className="page-header"><h1 className="page-title">行程内容审核</h1><p className="page-subtitle">查看已发布行程，对违规内容停止公开展示</p></div>
      <Card>
        <div className={styles.toolbar}>
          <Select value={reviewStatus} options={statusOptions} style={{ width: 150 }} onChange={(value) => { setReviewStatus(value); setPage(1); }} />
          <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
        </div>
        {error ? <Alert type="error" showIcon message="行程审核数据加载失败" description={error} style={{ marginBottom: 16 }} /> : null}
        <Table columns={columns} dataSource={trips} rowKey="_id" loading={loading} scroll={{ x: 1150 }} locale={{ emptyText: <Empty description="当前筛选条件下没有行程" /> }} pagination={{ current: page, pageSize, total, showSizeChanger: true, showQuickJumper: true, showTotal: (value) => `共 ${value} 条`, onChange: (nextPage, nextSize) => { setPage(nextPage); setPageSize(nextSize); } }} />
      </Card>

      <Modal title="行程审核" open={!!current} width={820} onCancel={() => { if (!submitting) { setCurrent(null); setRemark(''); } }} footer={current ? [
        current.reviewStatus !== 'rejected' ? <Popconfirm key="reject" title="确认该行程不通过？将立即停止公开展示" onConfirm={() => submitReview('rejected')} okText="确认" cancelText="取消"><Button danger icon={<CloseCircleOutlined />} loading={submitting}>不通过</Button></Popconfirm> : null,
        current.reviewStatus !== 'approved' ? <Popconfirm key="approve" title="确认恢复该行程公开展示？" onConfirm={() => submitReview('approved')} okText="确认" cancelText="取消"><Button type="primary" icon={<CheckCircleOutlined />} loading={submitting}>恢复展示</Button></Popconfirm> : null,
      ].filter(Boolean) : null}>
        {current ? <div className={styles.detail}>
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="行程名称" span={2}>{current.tripTitle || current.placeName || '未命名行程'}</Descriptions.Item>
            <Descriptions.Item label="发起人">{current.creatorName || '旅行者'}</Descriptions.Item><Descriptions.Item label="发布环境">{current.dataEnv || 'dev'}</Descriptions.Item>
            <Descriptions.Item label="出发日期">{current.date || '-'}</Descriptions.Item><Descriptions.Item label="集合时间">{current.meetingTime || '-'}</Descriptions.Item>
            <Descriptions.Item label="出发地">{current.departure || '-'}</Descriptions.Item><Descriptions.Item label="集合地点">{current.meetingPlace || '-'}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{current.contactPhone || '-'}</Descriptions.Item><Descriptions.Item label="人数">{current.currentCount || 0} 人，还需 {current.needCount || 0} 人</Descriptions.Item>
            <Descriptions.Item label="行程描述" span={2}><div className={styles.content}>{current.travelDesc || '未填写'}</div></Descriptions.Item>
            <Descriptions.Item label="备注" span={2}><div className={styles.content}>{current.remark || '无'}</div></Descriptions.Item>
          </Descriptions>
          <div className={styles.sectionTitle}>行程图片（{images.length}）</div>
          {images.length ? <Image.PreviewGroup><div className={styles.imageGrid}>{images.map((url) => <Image key={url} src={url} className={styles.detailImage} />)}</div></Image.PreviewGroup> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无自定义图片" />}
          <div className={styles.sectionTitle}>审核备注</div><Input.TextArea value={remark} maxLength={200} showCount rows={3} placeholder="可选，填写审核说明" onChange={(event) => setRemark(event.target.value)} />
          {current.adminReviewedAt ? <div className={styles.reviewInfo}><span>处理人：{current.adminReviewerName || '-'}</span><span>处理时间：{formatTime(current.adminReviewedAt)}</span></div> : null}
        </div> : null}
      </Modal>
    </div>
  );
};

export default TripReviews;
