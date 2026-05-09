import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { generateAIImageChannelId, useAIImageChannelStore } from '@/stores/aiImageChannels';
import type { AIImageChannel } from '@/types';
import styles from './index.module.scss';

const { TextArea } = Input;

function formatTime(value?: number) {
  return value ? new Date(value).toLocaleString() : '-';
}

function getSuccessRate(record: AIImageChannel) {
  const success = Number(record.successCount || 0);
  const fail = Number(record.failCount || 0);
  const total = success + fail;
  if (!total) return '0.0%';
  return `${((success / total) * 100).toFixed(1)}%`;
}

async function copyText(value: string) {
  if (!value) return false;

  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(value);
      return true;
    }

    const input = document.createElement('textarea');
    input.value = value;
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(input);
    return copied;
  } catch (error) {
    console.error('Copy AI image channel id error:', error);
    return false;
  }
}

function stopMouseDown(event: React.MouseEvent<HTMLElement>) {
  event.preventDefault();
}

function buildChannelIdAddon(
  editingChannel: AIImageChannel | null,
  onRegenerate: () => void,
  onCopy: () => void
) {
  return (
    <Space size={4}>
      {!editingChannel && (
        <Button
          type="link"
          size="small"
          icon={<ReloadOutlined />}
          onMouseDown={stopMouseDown}
          onClick={onRegenerate}
        >
          重新生成
        </Button>
      )}
      <Button
        type="link"
        size="small"
        icon={<CopyOutlined />}
        onMouseDown={stopMouseDown}
        onClick={onCopy}
      >
        复制
      </Button>
    </Space>
  );
}

const AIImageChannelsPage: React.FC = () => {
  const {
    channels,
    loading,
    total,
    fetchList,
    create,
    update,
    delete: deleteChannel,
    toggleEnabled,
  } = useAIImageChannelStore();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<AIImageChannel | null>(null);
  const [form] = Form.useForm();

  const loadData = useCallback(async () => {
    await fetchList({ page, pageSize, keyword });
  }, [fetchList, page, pageSize, keyword]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = () => {
    setEditingChannel(null);
    form.resetFields();
    form.setFieldsValue({
      channelId: generateAIImageChannelId(),
      name: 'AI 生图渠道',
      remark: '',
      enabled: true,
      callCount: 0,
      successCount: 0,
      failCount: 0,
    });
    setModalOpen(true);
  };

  const handleEdit = (record: AIImageChannel) => {
    setEditingChannel(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleRegenerateChannelId = () => {
    form.setFieldsValue({ channelId: generateAIImageChannelId() });
  };

  const handleCopyFormChannelId = async () => {
    const channelId = String(form.getFieldValue('channelId') || '').trim();
    const copied = await copyText(channelId);
    if (copied) {
      message.success('渠道 ID 已复制');
    } else {
      message.error('复制失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const result = editingChannel && editingChannel._id
        ? await update(editingChannel._id, values)
        : await create(values);

      if (result.success) {
        message.success(result.message);
        setModalOpen(false);
        loadData();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Validate AI image channel error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteChannel(id);
    if (result.success) {
      message.success(result.message);
      loadData();
    } else {
      message.error(result.message);
    }
  };

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    const result = await toggleEnabled(id, enabled);
    if (result.success) {
      message.success(result.message);
    } else {
      message.error(result.message);
    }
  };

  const columns = [
    {
      title: '渠道',
      key: 'channel',
      width: 260,
      render: (_: unknown, record: AIImageChannel) => (
        <div className={styles.channelMeta}>
          <Space>
            <strong>{record.name || '-'}</strong>
            <Tag color={record.enabled === false ? 'default' : 'green'}>
              {record.enabled === false ? '停用' : '启用'}
            </Tag>
          </Space>
          <div className={styles.descText}>{record.remark || '-'}</div>
        </div>
      ),
    },
    {
      title: '渠道 ID',
      dataIndex: 'channelId',
      key: 'channelId',
      width: 300,
      render: (value: string) => (
        <Typography.Text
          code
          copyable={{ text: value }}
          className={styles.channelIdText}
        >
          {value || '-'}
        </Typography.Text>
      ),
    },
    {
      title: '调用统计',
      key: 'metrics',
      width: 280,
      render: (_: unknown, record: AIImageChannel) => (
        <div>
          <div className={styles.metricGroup}>
            <Tag color="blue">调用 {record.callCount || 0}</Tag>
            <Tag color="green">成功 {record.successCount || 0}</Tag>
            <Tag color="red">失败 {record.failCount || 0}</Tag>
          </div>
          <div className={styles.rateText}>成功率 {getSuccessRate(record)}</div>
        </div>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (value: number) => formatTime(value),
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 90,
      render: (enabled: boolean, record: AIImageChannel) => (
        <Switch
          checked={enabled}
          onChange={(checked) => record._id && handleToggleEnabled(record._id, checked)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: AIImageChannel) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个渠道？"
            okText="确定"
            cancelText="取消"
            onConfirm={() => record._id && handleDelete(record._id)}
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
        <h1 className="page-title">AI 渠道管理</h1>
      </div>

      <Card>
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <Input.Search
              allowClear
              placeholder="搜索渠道名称 / ID / 备注"
              style={{ width: 320 }}
              onSearch={(value) => {
                setKeyword(value);
                setPage(1);
              }}
            />
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增渠道
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={channels}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (value) => `共 ${value} 条`,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
        />
      </Card>

      <Modal
        title={editingChannel ? '编辑 AI 渠道' : '新增 AI 渠道'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={680}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="channelId"
            label="渠道 ID"
            rules={[
              { required: true, message: '请输入渠道 ID' },
              { pattern: /^[A-Za-z0-9_-]+$/, message: '只支持字母、数字、下划线和中划线' },
            ]}
          >
            <Input
              disabled={Boolean(editingChannel)}
              maxLength={80}
              showCount
              addonAfter={buildChannelIdAddon(editingChannel, handleRegenerateChannelId, handleCopyFormChannelId)}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="渠道名称"
            rules={[{ required: true, message: '请输入渠道名称' }]}
          >
            <Input placeholder="例如：主渠道" maxLength={30} showCount />
          </Form.Item>

          <Form.Item name="remark" label="备注">
            <TextArea placeholder="记录渠道用途或云托管环境变量后缀" maxLength={120} showCount rows={3} />
          </Form.Item>

          <Space size={16} style={{ width: '100%' }}>
            <Form.Item name="callCount" label="调用次数">
              <InputNumber min={0} precision={0} style={{ width: 140 }} />
            </Form.Item>

            <Form.Item name="successCount" label="成功次数">
              <InputNumber min={0} precision={0} style={{ width: 140 }} />
            </Form.Item>

            <Form.Item name="failCount" label="失败次数">
              <InputNumber min={0} precision={0} style={{ width: 140 }} />
            </Form.Item>
          </Space>

          <Form.Item name="enabled" label="启用状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AIImageChannelsPage;
