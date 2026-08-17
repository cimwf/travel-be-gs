import { useCallback, useEffect, useState } from 'react';
import {
  Avatar, Button, Card, Empty, Form, Image, Input, Modal, Popconfirm, Select,
  Space, Table, Tabs, Tag, Upload, message, type UploadFile,
} from 'antd';
import {
  EditOutlined, PlusOutlined, ReloadOutlined, SendOutlined, StopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/auth';
import { callCloudFunction } from '@/utils/cloudbase';
import { uploadOfficialImages, type OfficialMedia } from '@/utils/officialCos';
import styles from './index.module.scss';

interface OfficialAccount {
  _id: string;
  nickname: string;
  avatar: string;
  avatarObject?: OfficialMedia | null;
  bio: string;
  region: string;
  status: 'active' | 'disabled';
  createdAt: number;
}

interface OfficialPost {
  _id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  images: Array<OfficialMedia | string>;
  status: 'active' | 'deleted';
  dataEnv: 'dev' | 'prod';
  createdAt: number;
}

interface OfficialPostUploadFile extends UploadFile {
  existingMedia?: OfficialMedia | string;
}

const DISTRICTS = ['海淀区', '朝阳区', '丰台区', '东城区', '西城区', '石景山区', '门头沟区', '房山区', '通州区', '顺义区', '昌平区', '大兴区', '怀柔区', '平谷区', '密云区', '延庆区'];
const imageUrl = (image: OfficialMedia | string) => typeof image === 'string' ? image : image.url;
const formatTime = (time: number) => time ? new Date(time).toLocaleString('zh-CN') : '-';

export default function OfficialCommunity() {
  const adminId = useAuthStore((state) => state.user?.id || '');
  const [accounts, setAccounts] = useState<OfficialAccount[]>([]);
  const [posts, setPosts] = useState<OfficialPost[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [accountModal, setAccountModal] = useState(false);
  const [postModal, setPostModal] = useState(false);
  const [editing, setEditing] = useState<OfficialAccount | null>(null);
  const [editingPost, setEditingPost] = useState<OfficialPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [avatarFiles, setAvatarFiles] = useState<UploadFile[]>([]);
  const [postFiles, setPostFiles] = useState<OfficialPostUploadFile[]>([]);
  const [publishingPostId, setPublishingPostId] = useState('');
  const [accountForm] = Form.useForm();
  const [postForm] = Form.useForm();

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const result = await callCloudFunction<{ success: boolean; accounts?: OfficialAccount[]; error?: string }>('admin/officialAccountList', { adminId });
      if (!result.success) throw new Error(result.error || '加载失败');
      setAccounts(result.accounts || []);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '官方账号加载失败');
    } finally {
      setLoadingAccounts(false);
    }
  }, [adminId]);

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const result = await callCloudFunction<{ success: boolean; posts?: OfficialPost[]; total?: number; error?: string }>('admin/officialPostList', { adminId, page, pageSize: 10 });
      if (!result.success) throw new Error(result.error || '加载失败');
      setPosts(result.posts || []);
      setTotal(result.total || 0);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '官方内容加载失败');
    } finally {
      setLoadingPosts(false);
    }
  }, [adminId, page]);

  useEffect(() => { void loadAccounts(); }, [loadAccounts]);
  useEffect(() => { void loadPosts(); }, [loadPosts]);

  const openAccount = (account?: OfficialAccount) => {
    setEditing(account || null);
    setAvatarFiles([]);
    accountForm.setFieldsValue(account || { status: 'active', region: '' });
    setAccountModal(true);
  };

  const openPost = (post?: OfficialPost) => {
    setEditingPost(post || null);
    if (post) {
      postForm.setFieldsValue({
        accountId: post.authorId,
        content: post.content,
      });
      setPostFiles((post.images || []).map((image, index) => {
        const url = imageUrl(image);
        return {
          uid: `existing-${index}`,
          name: decodeURIComponent(url.split('/').pop()?.split('?')[0] || `图片${index + 1}`),
          status: 'done',
          url,
          existingMedia: image,
        };
      }));
    } else {
      postForm.resetFields();
      setPostFiles([]);
    }
    setPostModal(true);
  };

  const saveAccount = async () => {
    const values = await accountForm.validateFields();
    setSaving(true);
    try {
      const raw = avatarFiles[0]?.originFileObj;
      const upload = raw ? await uploadOfficialImages(adminId, 'avatar', [raw]) : { sessionId: '', media: [] };
      const result = await callCloudFunction<{ success: boolean; error?: string; message?: string }>('admin/officialAccountSave', {
        adminId,
        accountId: editing?._id || '',
        ...values,
        avatar: editing?.avatar || '',
        avatarObject: editing?.avatarObject || null,
        avatarUploadSessionId: upload.sessionId,
        avatarMedia: upload.media[0] || null,
      });
      if (!result.success) throw new Error(result.error || '保存失败');
      message.success(result.message || '保存成功');
      setAccountModal(false);
      await loadAccounts();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const savePost = async () => {
    const values = await postForm.validateFields();
    setSaving(true);
    try {
      const files = postFiles.map((file) => file.originFileObj).filter(Boolean) as File[];
      const upload = files.length ? await uploadOfficialImages(adminId, 'post', files) : { sessionId: '', media: [] };
      const action = editingPost ? 'admin/officialPostUpdate' : 'admin/officialPostCreate';
      const result = await callCloudFunction<{ success: boolean; error?: string; message?: string }>(action, {
        adminId,
        ...values,
        ...(editingPost ? {
          mode: 'edit',
          postId: editingPost._id,
          existingImages: postFiles.filter((file) => !file.originFileObj && file.existingMedia).map((file) => file.existingMedia),
        } : {}),
        uploadSessionId: upload.sessionId,
        images: upload.media,
      });
      if (!result.success) throw new Error(result.error || '保存失败');
      message.success(result.message || (editingPost ? '更新成功' : '发布成功'));
      postForm.resetFields();
      setPostFiles([]);
      setPostModal(false);
      setEditingPost(null);
      if (!editingPost) setPage(1);
      await loadPosts();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const updatePostStatus = async (post: OfficialPost, status: 'active' | 'deleted') => {
    const result = await callCloudFunction<{ success: boolean; error?: string; message?: string }>('admin/officialPostUpdate', { adminId, postId: post._id, status });
    if (!result.success) return message.error(result.error || '操作失败');
    message.success(result.message || '操作成功');
    await loadPosts();
  };

  const publishPost = async (post: OfficialPost) => {
    if (publishingPostId) return;
    setPublishingPostId(post._id);
    try {
      const result = await callCloudFunction<{ success: boolean; error?: string; message?: string }>('admin/officialPostUpdate', {
        adminId,
        postId: post._id,
        mode: 'publish',
      });
      if (!result.success) return message.error(result.error || '发布失败');
      message.success(result.message || '已发布到生产环境');
      await loadPosts();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '发布失败');
    } finally {
      setPublishingPostId('');
    }
  };

  const accountColumns = [
    { title: '账号', key: 'account', render: (_: unknown, item: OfficialAccount) => <Space><Avatar src={item.avatar || undefined} icon={!item.avatar ? <UserOutlined /> : undefined} /><div><div>{item.nickname} <Tag color="blue">官方</Tag></div><div className={styles.muted}>{item._id}</div></div></Space> },
    { title: '地区', dataIndex: 'region', render: (value: string) => value || '未设置' },
    { title: '简介', dataIndex: 'bio', ellipsis: true, render: (value: string) => value || '-' },
    { title: '状态', dataIndex: 'status', width: 100, render: (value: string) => <Tag color={value === 'active' ? 'success' : 'default'}>{value === 'active' ? '启用' : '停用'}</Tag> },
    { title: '创建时间', dataIndex: 'createdAt', width: 180, render: formatTime },
    { title: '操作', key: 'action', width: 110, render: (_: unknown, item: OfficialAccount) => <Button type="link" icon={<EditOutlined />} onClick={() => openAccount(item)}>编辑</Button> },
  ];

  const postColumns = [
    { title: '发布账号', key: 'author', width: 180, render: (_: unknown, item: OfficialPost) => <Space><Avatar src={item.authorAvatar || undefined} />{item.authorName}</Space> },
    { title: '正文', dataIndex: 'content', ellipsis: true, render: (value: string) => value || <span className={styles.muted}>纯图片动态</span> },
    { title: '图片', key: 'images', width: 220, render: (_: unknown, item: OfficialPost) => <Image.PreviewGroup><Space size={6}>{(item.images || []).slice(0, 3).map((image, index) => <Image key={index} src={imageUrl(image)} width={48} height={48} className={styles.cover} />)}{item.images?.length > 3 && <Tag>+{item.images.length - 3}</Tag>}</Space></Image.PreviewGroup> },
    { title: '环境', dataIndex: 'dataEnv', width: 90, render: (value: string) => <Tag color={value === 'prod' ? 'success' : 'processing'}>{value === 'prod' ? '生产' : '测试'}</Tag> },
    { title: '状态', dataIndex: 'status', width: 90, render: (value: string, item: OfficialPost) => <Tag color={value === 'active' ? 'success' : 'default'}>{value === 'active' ? (item.dataEnv === 'prod' ? '展示中' : '测试中') : '已删除'}</Tag> },
    { title: '发布时间', dataIndex: 'createdAt', width: 180, render: formatTime },
    { title: '操作', key: 'action', width: 240, render: (_: unknown, item: OfficialPost) => <Space size={0}>{item.status === 'active' && item.dataEnv === 'dev' ? <Popconfirm title="确认发布到生产环境？" description="发布时间将更新为当前时间，线上用户会立即看到。" onConfirm={() => publishPost(item)}><Button type="link" icon={<SendOutlined />} loading={publishingPostId === item._id}>发布</Button></Popconfirm> : null}<Button type="link" icon={<EditOutlined />} onClick={() => openPost(item)}>编辑</Button>{item.status === 'active' ? <Popconfirm title="确认删除这条官方动态？" onConfirm={() => updatePostStatus(item, 'deleted')}><Button type="link" danger icon={<StopOutlined />}>删除</Button></Popconfirm> : <Button type="link" onClick={() => updatePostStatus(item, 'active')}>恢复</Button>}</Space> },
  ];

  return <div className={styles.container}>
    <div className="page-header"><h1 className="page-title">社区运营</h1><p className="page-subtitle">管理公开标识的官方账号，并以官方身份发布社区内容</p></div>
    <Tabs items={[
      { key: 'accounts', label: '官方账号', children: <Card extra={<Space><Button icon={<ReloadOutlined />} onClick={loadAccounts}>刷新</Button><Button type="primary" icon={<PlusOutlined />} onClick={() => openAccount()}>新建官方账号</Button></Space>}><Table rowKey="_id" loading={loadingAccounts} columns={accountColumns} dataSource={accounts} pagination={false} locale={{ emptyText: <Empty description="还没有官方账号" /> }} /></Card> },
      { key: 'posts', label: '官方动态', children: <Card extra={<Space><Button icon={<ReloadOutlined />} onClick={loadPosts}>刷新</Button><Button type="primary" icon={<PlusOutlined />} disabled={!accounts.some((item) => item.status === 'active')} onClick={() => openPost()}>准备官方动态</Button></Space>}><Table rowKey="_id" loading={loadingPosts} columns={postColumns} dataSource={posts} scroll={{ x: 1190 }} pagination={{ current: page, pageSize: 10, total, onChange: setPage, showTotal: (value) => `共 ${value} 条` }} locale={{ emptyText: <Empty description="还没有官方动态" /> }} /></Card> },
    ]} />

    <Modal title={editing ? '编辑官方账号' : '新建官方账号'} open={accountModal} confirmLoading={saving} onOk={saveAccount} onCancel={() => setAccountModal(false)} okText="保存">
      <Form form={accountForm} layout="vertical" preserve={false}>
        <Form.Item label="头像"><Space align="start">{editing?.avatar && !avatarFiles.length ? <Avatar size={80} src={editing.avatar} /> : null}<Upload accept="image/jpeg,image/png,image/webp" listType="picture-card" maxCount={1} fileList={avatarFiles} beforeUpload={() => false} onChange={({ fileList }) => setAvatarFiles(fileList)}><PlusOutlined /><div>选择图片</div></Upload></Space></Form.Item>
        <Form.Item name="nickname" label="账号名称" rules={[{ required: true, message: '请输入账号名称' }]}><Input maxLength={20} showCount /></Form.Item>
        <Form.Item name="bio" label="账号简介"><Input.TextArea maxLength={100} showCount rows={3} /></Form.Item>
        <Form.Item name="region" label="地区"><Select allowClear placeholder="可选，北京市内区域" options={DISTRICTS.map((value) => ({ value, label: value }))} /></Form.Item>
        <Form.Item name="status" label="账号状态"><Select options={[{ value: 'active', label: '启用' }, { value: 'disabled', label: '停用' }]} /></Form.Item>
      </Form>
    </Modal>

    <Modal title={editingPost ? '编辑官方动态' : '准备官方动态'} width={680} open={postModal} confirmLoading={saving} onOk={savePost} onCancel={() => { setPostModal(false); setEditingPost(null); }} okText={editingPost ? '保存修改' : '保存到测试环境'}>
      <Form form={postForm} layout="vertical" preserve={false}>
        <Form.Item name="accountId" label="发布账号" rules={[{ required: true, message: '请选择官方账号' }]}><Select placeholder="选择一个启用的官方账号" options={accounts.filter((item) => item.status === 'active').map((item) => ({ value: item._id, label: item.nickname }))} /></Form.Item>
        <Form.Item name="content" label="正文"><Input.TextArea rows={6} maxLength={300} showCount placeholder="分享北京周边玩法、活动信息或生活动态" /></Form.Item>
        <Form.Item label="图片（最多 9 张）"><Upload accept="image/jpeg,image/png,image/webp" listType="picture-card" multiple maxCount={9} fileList={postFiles} beforeUpload={() => false} onChange={({ fileList }) => setPostFiles(fileList as OfficialPostUploadFile[])}>{postFiles.length < 9 ? <><PlusOutlined /><div>添加图片</div></> : null}</Upload></Form.Item>
        {!editingPost ? <div className={styles.muted}>保存后仅在测试环境展示，确认内容无误后可在列表中发布到生产环境。</div> : null}
      </Form>
    </Modal>
  </div>;
}
