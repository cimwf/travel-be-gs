import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Avatar, Button, Card, Descriptions, Empty, Image, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/auth';
import { useTripLogReviewStore, type TripLogReviewItem } from '@/stores/tripLogReviews';
import styles from './index.module.scss';

const statusOptions = [
  { value: 'pending', label: '待处理' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '未通过' },
];
const machineOptions = [
  { value: 'all', label: '全部机器结论' },
  { value: 'pass', label: 'Pass（已通过）' },
  { value: 'review', label: 'Review（待复核）' },
  { value: 'risky', label: 'Risky（高风险）' },
];
const machineMeta = {
  pass: { color: 'success', text: 'Pass' },
  review: { color: 'warning', text: 'Review' },
  risky: { color: 'error', text: 'Risky' },
} as const;
const reviewMeta = {
  not_required: { color: 'success', text: '自动通过' },
  pending: { color: 'processing', text: '待处理' },
  approved: { color: 'success', text: '已通过' },
  rejected: { color: 'error', text: '未通过' },
} as const;
const formatTime = (value?: number) => value ? new Date(value).toLocaleString('zh-CN') : '-';
const imageUrl = (item: TripLogReviewItem['images'] extends Array<infer T> | undefined ? T : never) =>
  typeof item === 'string' ? item : (item?.url || '');

const TripLogReviews: React.FC = () => {
  const { logs, total, loading, error, fetchList, review } = useTripLogReviewStore();
  const user = useAuthStore(state => state.user);
  const adminId = user?.id || '';
  const reviewerName = user?.nickname || user?.username || '管理员';
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reviewStatus, setReviewStatus] = useState('pending');
  const [machineSuggest, setMachineSuggest] = useState('all');
  const [current, setCurrent] = useState<TripLogReviewItem | null>(null);
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const loadData = useCallback(() => fetchList({ adminId, page, pageSize, reviewStatus, machineSuggest }),
    [adminId, fetchList, machineSuggest, page, pageSize, reviewStatus]);
  useEffect(() => { loadData(); }, [loadData]);

  const submit = async (decision: 'approved' | 'rejected') => {
    if (!current) return;
    setSubmitting(true);
    try {
      const result = await review({ adminId, logId: current._id, decision, remark, reviewerName });
      if (!result.success) return void message.error(result.message);
      message.success(result.message);
      setCurrent(null); setRemark('');
      if (logs.length === 1 && page > 1) setPage(page - 1); else await loadData();
    } finally { setSubmitting(false); }
  };

  const columns = useMemo(() => [
    { title: '发布用户', key: 'publisher', width: 190, render: (_: unknown, item: TripLogReviewItem) => <Space><Avatar src={item.publisherAvatar || undefined} icon={!item.publisherAvatar ? <UserOutlined /> : undefined} /><div><div>{item.publisherName || '旅行者'}</div><div className={styles.muted}>{item.publisherId || '-'}</div></div></Space> },
    { title: '旅行记录', dataIndex: 'content', key: 'content', ellipsis: true, render: (value?: string) => value || <span className={styles.muted}>纯图片或定位记录</span> },
    { title: '行程/地点', dataIndex: 'placeName', key: 'placeName', width: 140, ellipsis: true },
    { title: '图片', key: 'images', width: 220, render: (_: unknown, item: TripLogReviewItem) => { const urls = (item.images || []).map(imageUrl).filter(Boolean); return urls.length ? <Image.PreviewGroup><Space size={6} wrap>{urls.map((url, index) => <Image key={`${item._id}-${index}`} src={url} width={52} height={52} className={styles.cover} />)}</Space></Image.PreviewGroup> : '-'; } },
    { title: '机器结论', dataIndex: 'machineSuggest', key: 'machineSuggest', width: 105, render: (value: keyof typeof machineMeta) => machineMeta[value] ? <Tag color={machineMeta[value].color}>{machineMeta[value].text}</Tag> : '-' },
    { title: '处理状态', dataIndex: 'adminReviewStatus', key: 'adminReviewStatus', width: 105, render: (value: keyof typeof reviewMeta) => { const meta = reviewMeta[value] || reviewMeta.pending; return <Tag color={meta.color}>{meta.text}</Tag>; } },
    { title: '发布时间', dataIndex: 'createdAt', key: 'createdAt', width: 180, render: formatTime },
    { title: '操作', key: 'action', width: 110, fixed: 'right' as const, render: (_: unknown, item: TripLogReviewItem) => <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setCurrent(item); setRemark(item.adminReviewRemark || ''); }}>查看审核</Button> },
  ], []);

  const images = (current?.images || []).map(imageUrl).filter(Boolean);
  return <div className={styles.container}>
    <div className="page-header"><h1 className="page-title">旅行记录审核</h1><p className="page-subtitle">复核待处理、高风险及已经发布的旅行记录</p></div>
    <Card>
      <div className={styles.toolbar}><Space wrap><Select value={reviewStatus} options={statusOptions} style={{ width: 130 }} onChange={value => { setReviewStatus(value); setPage(1); }} /><Select value={machineSuggest} options={machineOptions} style={{ width: 190 }} onChange={value => { setMachineSuggest(value); setPage(1); }} /></Space><Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button></div>
      {error ? <Alert type="error" showIcon message="旅行记录审核数据加载失败" description={error} style={{ marginBottom: 16 }} /> : null}
      <Table columns={columns} dataSource={logs} rowKey="_id" loading={loading} scroll={{ x: 1250 }} locale={{ emptyText: <Empty description="当前筛选条件下没有旅行记录" /> }} pagination={{ current: page, pageSize, total, showSizeChanger: true, showQuickJumper: true, showTotal: value => `共 ${value} 条`, onChange: (next, size) => { setPage(next); setPageSize(size); } }} />
    </Card>
    <Modal title="旅行记录审核" open={!!current} width={780} onCancel={() => { if (!submitting) { setCurrent(null); setRemark(''); } }} footer={current ? [current.adminReviewStatus !== 'rejected' ? <Popconfirm key="reject" title="确认审核不通过？该记录将停止公开展示" onConfirm={() => submit('rejected')}><Button danger icon={<CloseCircleOutlined />} loading={submitting}>不通过</Button></Popconfirm> : null, current.adminReviewStatus !== 'approved' ? <Popconfirm key="approve" title="确认审核通过并公开展示？" onConfirm={() => submit('approved')}><Button type="primary" icon={<CheckCircleOutlined />} loading={submitting}>审核通过</Button></Popconfirm> : null].filter(Boolean) : null}>
      {current ? <div className={styles.detail}><Descriptions column={2} size="small" bordered><Descriptions.Item label="发布用户">{current.publisherName || '旅行者'}</Descriptions.Item><Descriptions.Item label="发布时间">{formatTime(current.createdAt)}</Descriptions.Item><Descriptions.Item label="所属地点">{current.placeName || '-'}</Descriptions.Item><Descriptions.Item label="天气">{current.weatherLabel || '-'}</Descriptions.Item><Descriptions.Item label="定位" span={2}>{current.location?.name || current.location?.address || '未添加定位'}</Descriptions.Item><Descriptions.Item label="记录内容" span={2}><div className={styles.content}>{current.content || '（纯图片或定位记录）'}</div></Descriptions.Item></Descriptions><div className={styles.sectionTitle}>记录图片（{images.length}）</div>{images.length ? <Image.PreviewGroup><div className={styles.imageGrid}>{images.map((url, index) => <Image key={index} src={url} className={styles.detailImage} />)}</div></Image.PreviewGroup> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无图片" />}<div className={styles.sectionTitle}>审核备注</div><Input.TextArea value={remark} maxLength={200} showCount rows={3} placeholder="可选，填写审核说明" onChange={event => setRemark(event.target.value)} />{current.adminReviewedAt ? <div className={styles.reviewInfo}><span>处理人：{current.adminReviewerName || '-'}</span><span>处理时间：{formatTime(current.adminReviewedAt)}</span></div> : null}</div> : null}
    </Modal>
  </div>;
};

export default TripLogReviews;
