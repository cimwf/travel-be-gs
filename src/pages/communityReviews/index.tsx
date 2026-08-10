import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Card, Descriptions, Empty, Image, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/auth';
import { useCommunityReviewStore, type CommunityReviewPost } from '@/stores/communityReviews';
import styles from './index.module.scss';

const reviewStatusOptions = [
  { value: 'pending', label: '待处理' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '未通过' },
];

const machineSuggestOptions = [
  { value: 'all', label: '全部风险结论' },
  { value: 'review', label: 'Review（待复核）' },
  { value: 'risky', label: 'Risky（高风险）' },
];

const reviewMeta = {
  pending: { color: 'processing', text: '待处理' },
  approved: { color: 'success', text: '已通过' },
  rejected: { color: 'error', text: '未通过' },
} as const;

const machineMeta = {
  review: { color: 'warning', text: 'Review' },
  risky: { color: 'error', text: 'Risky' },
} as const;

function formatTime(value?: number) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-';
}

function imageUrl(image: CommunityReviewPost['images'][number]) {
  return typeof image === 'string' ? image : (image.url || '');
}

const CommunityReviews: React.FC = () => {
  const { posts, total, loading, fetchList, review } = useCommunityReviewStore();
  const reviewerName = useAuthStore((state) => state.user?.nickname || state.user?.username || '管理员');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [machineSuggest, setMachineSuggest] = useState<'all' | 'review' | 'risky'>('all');
  const [current, setCurrent] = useState<CommunityReviewPost | null>(null);
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(
    () => fetchList({ page, pageSize, reviewStatus, machineSuggest }),
    [fetchList, machineSuggest, page, pageSize, reviewStatus],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const submitReview = async (decision: 'approved' | 'rejected') => {
    if (!current) return;
    setSubmitting(true);
    try {
      const result = await review(current, decision, remark, reviewerName);
      if (!result.success) {
        message.error(result.message);
        return;
      }
      message.success(result.message);
      setCurrent(null);
      setRemark('');
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(() => [
    {
      title: '发布用户',
      key: 'author',
      width: 180,
      render: (_: unknown, record: CommunityReviewPost) => (
        <Space>
          <Avatar src={record.authorAvatar}>{(record.authorName || '旅').slice(0, 1)}</Avatar>
          <div>
            <div>{record.authorName || '旅行者'}</div>
            <div className={styles.muted}>{record.authorId || '-'}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '作品内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (content: string) => content || <span className={styles.muted}>纯图片作品</span>,
    },
    {
      title: '图片',
      key: 'images',
      width: 90,
      render: (_: unknown, record: CommunityReviewPost) => {
        const url = record.images?.[0] ? imageUrl(record.images[0]) : '';
        return url ? <Image src={url} width={64} height={64} className={styles.cover} /> : '-';
      },
    },
    {
      title: '机器结论',
      dataIndex: 'machineSuggest',
      key: 'machineSuggest',
      width: 110,
      render: (value: 'review' | 'risky') => {
        const meta = machineMeta[value];
        return meta ? <Tag color={meta.color}>{meta.text}</Tag> : '-';
      },
    },
    {
      title: '处理状态',
      dataIndex: 'adminReviewStatus',
      key: 'adminReviewStatus',
      width: 100,
      render: (value: 'pending' | 'approved' | 'rejected') => {
        const meta = reviewMeta[value] || reviewMeta.pending;
        return <Tag color={meta.color}>{meta.text}</Tag>;
      },
    },
    {
      title: '发布时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: formatTime,
    },
    {
      title: '操作',
      key: 'action',
      width: 110,
      fixed: 'right' as const,
      render: (_: unknown, record: CommunityReviewPost) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setCurrent(record); setRemark(record.adminReviewRemark || ''); }}>
          查看审核
        </Button>
      ),
    },
  ], []);

  return (
    <div className={styles.container}>
      <div className="page-header">
        <h1 className="page-title">社区内容审核</h1>
        <p className="page-subtitle">处理微信机器审核标记为 Review 或 Risky 的社区作品</p>
      </div>

      <Card>
        <div className={styles.toolbar}>
          <Space wrap>
            <Select value={reviewStatus} options={reviewStatusOptions} style={{ width: 130 }} onChange={(value) => { setReviewStatus(value); setPage(1); }} />
            <Select value={machineSuggest} options={machineSuggestOptions} style={{ width: 190 }} onChange={(value) => { setMachineSuggest(value); setPage(1); }} />
          </Space>
          <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
        </div>
        <Table
          columns={columns}
          dataSource={posts}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1050 }}
          locale={{ emptyText: <Empty description="当前没有需要处理的作品" /> }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (value) => `共 ${value} 条`,
            onChange: (nextPage, nextPageSize) => { setPage(nextPage); setPageSize(nextPageSize); },
          }}
        />
      </Card>

      <Modal
        title="作品审核"
        open={!!current}
        width={760}
        onCancel={() => { if (!submitting) { setCurrent(null); setRemark(''); } }}
        footer={current?.adminReviewStatus === 'pending' ? [
          <Popconfirm key="reject" title="确认该作品审核不通过？" onConfirm={() => submitReview('rejected')} okText="确认" cancelText="取消">
            <Button danger icon={<CloseCircleOutlined />} loading={submitting}>不通过</Button>
          </Popconfirm>,
          <Popconfirm key="approve" title="确认该作品审核通过并公开展示？" onConfirm={() => submitReview('approved')} okText="确认" cancelText="取消">
            <Button type="primary" icon={<CheckCircleOutlined />} loading={submitting}>审核通过</Button>
          </Popconfirm>,
        ] : null}
      >
        {current && (
          <div className={styles.detail}>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="发布用户">{current.authorName || '旅行者'}</Descriptions.Item>
              <Descriptions.Item label="发布时间">{formatTime(current.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="机器结论"><Tag color={machineMeta[current.machineSuggest].color}>{machineMeta[current.machineSuggest].text}</Tag></Descriptions.Item>
              <Descriptions.Item label="处理状态"><Tag color={reviewMeta[current.adminReviewStatus].color}>{reviewMeta[current.adminReviewStatus].text}</Tag></Descriptions.Item>
              <Descriptions.Item label="定位" span={2}>{current.location?.name || current.location?.address || '未添加定位'}</Descriptions.Item>
              <Descriptions.Item label="作品内容" span={2}><div className={styles.content}>{current.content || '（纯图片作品）'}</div></Descriptions.Item>
            </Descriptions>
            <div className={styles.sectionTitle}>作品图片（{current.images?.length || 0}）</div>
            <Image.PreviewGroup>
              <div className={styles.imageGrid}>
                {(current.images || []).map((item, index) => <Image key={index} src={imageUrl(item)} className={styles.detailImage} />)}
              </div>
            </Image.PreviewGroup>
            {current.images?.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无图片" />}
            <div className={styles.sectionTitle}>审核备注</div>
            <Input.TextArea
              value={remark}
              disabled={current.adminReviewStatus !== 'pending'}
              maxLength={200}
              showCount
              rows={3}
              placeholder="可选，填写审核说明"
              onChange={(event) => setRemark(event.target.value)}
            />
            {current.adminReviewedAt ? <div className={styles.reviewInfo}>处理人：{current.adminReviewerName || '-'} <span>处理时间：{formatTime(current.adminReviewedAt)}</span></div> : null}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CommunityReviews;
