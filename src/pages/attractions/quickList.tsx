import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Space, Popconfirm, message, Image, Empty, Modal, Form, Select } from 'antd';
import { SearchOutlined, DeleteOutlined, EditOutlined, ReloadOutlined, ImportOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuickAttractionsStore } from '@/stores/quickAttractions';
import { locationOptions } from '@/mock/attractions';
import ImageSelector from '@/components/ImageSelector';
import styles from './index.module.scss';

const { TextArea } = Input;

const QuickAttractionsList: React.FC = () => {
  const navigate = useNavigate();
  const { fetchList, delete: deleteAttraction, update, batchCreate, attractions, total, loading } = useQuickAttractionsStore();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importing, setImporting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ _id?: string; name: string; location: string; coverImage: string } | null>(null);
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [imageSelectorOpen, setImageSelectorOpen] = useState(false);
  const [editForm] = Form.useForm();

  const loadData = async () => {
    await fetchList({ page, pageSize, keyword });
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, keyword]);

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

  const openEditModal = (record: { _id?: string; name: string; location: string; coverImage: string }) => {
    setEditingItem(record);
    setEditCoverUrl(record.coverImage);
    editForm.setFieldsValue({ name: record.name, location: record.location });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingItem?._id) return;

    try {
      const values = await editForm.validateFields();
      const result = await update(editingItem._id, {
        name: values.name,
        location: values.location,
        coverImage: editCoverUrl,
      });

      if (result.success) {
        message.success(result.message);
        setEditModalOpen(false);
        loadData();
      } else {
        message.error(result.message);
      }
    } catch {
      // validation failed
    }
  };

  const handleImportJson = async () => {
    try {
      const parsed = JSON.parse(importJson);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      const validItems = items.filter(item => item.name);

      if (validItems.length === 0) {
        message.error('没有有效的景点数据，请确保包含 name 字段');
        return;
      }

      setImporting(true);
      const result = await batchCreate(validItems);

      if (result.success) {
        message.success(result.message);
        setImportModalOpen(false);
        setImportJson('');
        loadData();
      } else {
        message.error(result.message);
      }
    } catch {
      message.error('JSON 格式错误，请检查');
    } finally {
      setImporting(false);
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
      width: 200,
    },
    {
      title: '所在地区',
      dataIndex: 'location',
      key: 'location',
      width: 120,
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
      width: 150,
      render: (_: unknown, record: { _id?: string; name: string; location: string; coverImage: string }) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
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
        <h1 className="page-title">景点列表</h1>
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
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
            <Button icon={<ImportOutlined />} onClick={() => setImportModalOpen(true)}>
              JSON导入
            </Button>
            <Button
              type="primary"
              onClick={() => navigate('/attractions/quickAdd')}
            >
              快速添加
            </Button>
          </Space>
        </div>

        {attractions.length === 0 && !loading ? (
          <Empty
            description="暂无景点"
            style={{ padding: '60px 0' }}
          >
            <Space>
              <Button onClick={() => setImportModalOpen(true)}>
                JSON导入
              </Button>
              <Button type="primary" onClick={() => navigate('/attractions/quickAdd')}>
                快速添加景点
              </Button>
            </Space>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={attractions}
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
        )}
      </Card>

      {/* JSON 导入弹窗 */}
      <Modal
        title="JSON 导入"
        open={importModalOpen}
        onCancel={() => {
          setImportModalOpen(false);
          setImportJson('');
        }}
        onOk={handleImportJson}
        okText="导入"
        cancelText="取消"
        width={600}
        confirmLoading={importing}
      >
        <div style={{ marginBottom: 12 }}>
          <p style={{ color: '#666', marginBottom: 8 }}>
            请粘贴 JSON 数组，必填字段：name，可选：location、coverImage
          </p>
        </div>
        <TextArea
          rows={12}
          placeholder={`[
  { "name": "东灵山", "location": "门头沟区", "coverImage": "https://..." },
  { "name": "百花山", "location": "门头沟区" }
]`}
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
        />
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑景点"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleEditSubmit}
        okText="保存"
        cancelText="取消"
        width={500}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="name"
            label="景点名称"
            rules={[{ required: true, message: '请输入景点名称' }]}
          >
            <Input placeholder="请输入景点名称" maxLength={50} />
          </Form.Item>

          <Form.Item
            name="location"
            label="所在地区"
            rules={[{ required: true, message: '请选择所在地区' }]}
          >
            <Select
              placeholder="请选择所在地区"
              options={locationOptions.map((l) => ({ value: l, label: l }))}
            />
          </Form.Item>

          <Form.Item label="景点封面">
            <Space direction="vertical" style={{ width: '100%' }}>
              {editCoverUrl ? (
                <Space>
                  <Image
                    src={editCoverUrl}
                    width={120}
                    height={90}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                  />
                  <Button size="small" onClick={() => setImageSelectorOpen(true)}>
                    更换
                  </Button>
                </Space>
              ) : (
                <Button onClick={() => setImageSelectorOpen(true)}>
                  选择封面
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 图片选择弹窗 */}
      <ImageSelector
        open={imageSelectorOpen}
        onSelect={(url) => {
          setEditCoverUrl(url);
          setImageSelectorOpen(false);
        }}
        onClose={() => setImageSelectorOpen(false)}
      />
    </div>
  );
};

export default QuickAttractionsList;
