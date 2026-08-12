import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Avatar, Button, Card, Descriptions, Empty, Image, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd';
import { CheckOutlined, EyeOutlined, ReloadOutlined, SafetyCertificateOutlined, StopOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { useReportStore, type ReportItem, type ReportStatus, type ReportTarget } from '@/stores/reports';
import styles from './index.module.scss';

const statusOptions = [
  { value: 'pending', label: '待处理' },
  { value: 'processed', label: '已处理' },
  { value: 'ignored', label: '已忽略' },
  { value: 'all', label: '全部状态' },
];
const typeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'community_post', label: '社区作品' },
  { value: 'trip_log', label: '旅行记录' },
];
const statusMeta = {
  pending: { color: 'processing', text: '待处理' },
  processed: { color: 'success', text: '已处理' },
  ignored: { color: 'default', text: '已忽略' },
} as const;
const formatTime = (value?: number) => value ? new Date(value).toLocaleString('zh-CN') : '-';
const imageUrl = (item: { url?: string } | string) => typeof item === 'string' ? item : (item.url || '');

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { reports, total, loading, error, fetchList, update } = useReportStore();
  const user = useAuthStore(state => state.user);
  const adminId = user?.id || '';
  const reviewerName = user?.nickname || user?.username || '管理员';
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState('pending');
  const [targetType, setTargetType] = useState('all');
  const [current, setCurrent] = useState<ReportItem | null>(null);
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const loadData = useCallback(() => fetchList({ adminId, page, pageSize, status, targetType }),
    [adminId, fetchList, page, pageSize, status, targetType]);
  useEffect(() => { loadData(); }, [loadData]);

  const submit = async (nextStatus: 'processed' | 'ignored') => {
    if (!current) return;
    setSubmitting(true);
    try {
      const result = await update({ adminId, reportId: current._id, status: nextStatus, remark, reviewerName });
      if (!result.success) return void message.error(result.message);
      message.success(result.message);
      setCurrent(null); setRemark('');
      if (reports.length === 1 && page > 1) setPage(page - 1); else await loadData();
    } finally { setSubmitting(false); }
  };

  const openReview = () => {
    if (!current?.target) return;
    const target: ReportTarget = {
      ...current.target,
      authorId: current.target.authorId || current.targetAuthorId,
      authorName: current.target.authorName || current.targetAuthorName,
      authorAvatar: current.target.authorAvatar || current.targetAuthorAvatar,
      publisherId: current.target.publisherId || current.targetAuthorId,
      publisherName: current.target.publisherName || current.targetAuthorName,
      publisherAvatar: current.target.publisherAvatar || current.targetAuthorAvatar,
      machineSuggest: current.target.machineSuggest || 'pass',
      adminReviewStatus: current.target.adminReviewStatus || 'not_required',
      reviewStatus: current.target.reviewStatus || 'approved',
    };
    navigate(current.targetType === 'community_post' ? '/community-reviews' : '/trip-log-reviews', {
      state: { reportedTarget: target, sourceReportId: current._id },
    });
  };

  const columns = useMemo(() => [
    { title: '举报人', key: 'reporter', width: 180, render: (_: unknown, item: ReportItem) => <Space><Avatar src={item.reporterAvatar || undefined} icon={!item.reporterAvatar ? <UserOutlined /> : undefined} /><div><div>{item.reporterName || '用户'}</div><div className={styles.muted}>{item.reporterId}</div></div></Space> },
    { title: '内容类型', dataIndex: 'targetType', key: 'targetType', width: 110, render: (value: ReportItem['targetType']) => <Tag color={value === 'community_post' ? 'blue' : 'cyan'}>{value === 'community_post' ? '社区作品' : '旅行记录'}</Tag> },
    { title: '举报原因', dataIndex: 'reason', key: 'reason', width: 120 },
    { title: '补充说明', dataIndex: 'description', key: 'description', ellipsis: true, render: (value?: string) => value || <span className={styles.muted}>未填写</span> },
    { title: '凭证', key: 'images', width: 75, render: (_: unknown, item: ReportItem) => `${item.images?.length || 0} 张` },
    { title: '状态', dataIndex: 'status', key: 'status', width: 95, render: (value: ReportStatus) => { const meta = statusMeta[value]; return <Tag color={meta.color}>{meta.text}</Tag>; } },
    { title: '举报时间', dataIndex: 'createdAt', key: 'createdAt', width: 180, render: formatTime },
    { title: '操作', key: 'action', width: 100, fixed: 'right' as const, render: (_: unknown, item: ReportItem) => <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setCurrent(item); setRemark(item.handleRemark || ''); }}>查看</Button> },
  ], []);

  const evidence = current?.images || [];
  const targetImages = current?.target?.images || [];
  return <div className={styles.container}>
    <div className="page-header"><h1 className="page-title">举报管理</h1><p className="page-subtitle">内部查看举报线索；内容违规处理仍进入原有审核流程</p></div>
    <Card>
      <div className={styles.toolbar}><Space wrap><Select value={status} options={statusOptions} style={{ width: 130 }} onChange={value => { setStatus(value); setPage(1); }} /><Select value={targetType} options={typeOptions} style={{ width: 140 }} onChange={value => { setTargetType(value); setPage(1); }} /></Space><Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button></div>
      {error ? <Alert type="error" showIcon message="举报数据加载失败" description={error} style={{ marginBottom: 16 }} /> : null}
      <Table columns={columns} dataSource={reports} rowKey="_id" loading={loading} scroll={{ x: 1050 }} locale={{ emptyText: <Empty description="当前没有举报记录" /> }} pagination={{ current: page, pageSize, total, showSizeChanger: true, showQuickJumper: true, showTotal: value => `共 ${value} 条`, onChange: (next, size) => { setPage(next); setPageSize(size); } }} />
    </Card>
    <Modal title="举报详情" open={!!current} width={820} onCancel={() => { if (!submitting) { setCurrent(null); setRemark(''); } }} footer={current ? [<span key="tip" className={styles.footerTip}>处理举报不会发送通知，也不会直接修改作品状态</span>, current.target ? <Button key="review" icon={<SafetyCertificateOutlined />} onClick={openReview}>进入内容审核</Button> : null, current.status === 'pending' ? <Popconfirm key="ignore" title="确认忽略这条举报？" onConfirm={() => submit('ignored')}><Button icon={<StopOutlined />} loading={submitting}>忽略</Button></Popconfirm> : null, current.status === 'pending' ? <Button key="done" type="primary" icon={<CheckOutlined />} loading={submitting} onClick={() => submit('processed')}>标记已处理</Button> : null].filter(Boolean) : null}>
      {current ? <div className={styles.detail}>
        <Descriptions column={2} size="small" bordered><Descriptions.Item label="举报人">{current.reporterName || '用户'}</Descriptions.Item><Descriptions.Item label="举报时间">{formatTime(current.createdAt)}</Descriptions.Item><Descriptions.Item label="内容类型">{current.targetType === 'community_post' ? '社区作品' : '旅行记录'}</Descriptions.Item><Descriptions.Item label="状态"><Tag color={statusMeta[current.status].color}>{statusMeta[current.status].text}</Tag></Descriptions.Item><Descriptions.Item label="举报原因">{current.reason}</Descriptions.Item><Descriptions.Item label="作品ID">{current.targetId}</Descriptions.Item><Descriptions.Item label="补充说明" span={2}><div className={styles.content}>{current.description || '未填写'}</div></Descriptions.Item></Descriptions>
        <div className={styles.sectionTitle}>举报凭证（{evidence.length}）</div>{evidence.length ? <Image.PreviewGroup><div className={styles.imageGrid}>{evidence.map((item, index) => <Image key={index} src={item.url} className={styles.detailImage} />)}</div></Image.PreviewGroup> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未上传凭证" />}
        <div className={styles.sectionTitle}>被举报内容</div>{current.target ? <div className={styles.targetBox}><div className={styles.targetMeta}><Avatar src={current.targetAuthorAvatar || undefined} icon={!current.targetAuthorAvatar ? <UserOutlined /> : undefined} /><div><div>{current.targetAuthorName || '旅行者'}</div><div className={styles.muted}>{formatTime(current.target.createdAt)}</div></div></div><div className={styles.targetContent}>{current.target.content || '（纯图片或定位内容）'}</div>{targetImages.length ? <Image.PreviewGroup><Space size={8} wrap style={{ marginTop: 12 }}>{targetImages.map((item, index) => <Image key={index} src={imageUrl(item)} width={86} height={86} style={{ objectFit: 'cover', borderRadius: 6 }} />)}</Space></Image.PreviewGroup> : null}</div> : <Alert type="warning" showIcon message="被举报内容已删除或不存在" />}
        <div className={styles.sectionTitle}>内部处理备注</div><Input.TextArea value={remark} maxLength={200} showCount rows={3} placeholder="可选，仅后台可见" onChange={event => setRemark(event.target.value)} />
        {current.handledAt ? <div className={styles.muted}>处理人：{current.handledByName || '-'}　处理时间：{formatTime(current.handledAt)}</div> : null}
      </div> : null}
    </Modal>
  </div>;
};

export default Reports;
