import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Image,
  Space,
  Popconfirm,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useBannerStore } from '@/stores/banners';
import { useAttractionsStore } from '@/stores/attractions';
import ImageSelector from '@/components/ImageSelector';
import styles from './index.module.scss';

const BannersPage: React.FC = () => {
  const {
    banners,
    loading,
    total,
    fetchList,
    create,
    update,
    delete: deleteBanner,
    updateSort,
    toggleEnabled,
  } = useBannerStore();

  const { attractions, fetchList: fetchAttractions } = useAttractionsStore();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<typeof banners[0] | null>(null);
  const [form] = Form.useForm();
  const [imageSelectorOpen, setImageSelectorOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    fetchList({ page, pageSize });
    fetchAttractions({ page: 1, pageSize: 100, keyword: '', category: 'all', location: 'all' });
  }, [page, pageSize]);

  // 打开新增弹窗
  const handleAdd = () => {
    setEditingBanner(null);
    setImageUrl('');
    form.resetFields();
    form.setFieldsValue({ linkType: 'attraction', enabled: true, sort: 1 });
    setModalVisible(true);
  };

  // 打开编辑弹窗
  const handleEdit = (record: typeof banners[0]) => {
    setEditingBanner(record);
    setImageUrl(record.image);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 获取关联的景点名称
      let linkName = '';
      if (values.linkType === 'attraction' && values.linkId) {
        const attraction = attractions.find((a) => a._id === values.linkId);
        linkName = attraction?.name || '';
      }

      const data = {
        ...values,
        image: imageUrl,
        linkName,
      };

      let result;
      if (editingBanner) {
        result = await update(editingBanner._id, data);
      } else {
        result = await create(data);
      }

      if (result.success) {
        message.success(result.message);
        setModalVisible(false);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // 删除 Banner
  const handleDelete = async (id: string) => {
    const result = await deleteBanner(id);
    if (result.success) {
      message.success(result.message);
    } else {
      message.error(result.message);
    }
  };

  // 切换启用状态
  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    const result = await toggleEnabled(id, enabled);
    if (result.success) {
      message.success(result.message);
    } else {
      message.error(result.message);
    }
  };

  // 上移
  const handleMoveUp = async (record: typeof banners[0], index: number) => {
    if (index === 0) return;
    const prevBanner = banners[index - 1];
    await updateSort(record._id, prevBanner.sort);
    await updateSort(prevBanner._id, record.sort);
  };

  // 下移
  const handleMoveDown = async (record: typeof banners[0], index: number) => {
    if (index === banners.length - 1) return;
    const nextBanner = banners[index + 1];
    await updateSort(record._id, nextBanner.sort);
    await updateSort(nextBanner._id, record.sort);
  };

  const columns = [
    {
      title: '图片',
      dataIndex: 'image',
      key: 'image',
      width: 150,
      render: (url: string) => (
        <Image
          src={url}
          width={120}
          height={60}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        />
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 150,
      render: (text: string) => text || '-',
    },
    {
      title: '跳转类型',
      dataIndex: 'linkType',
      key: 'linkType',
      width: 100,
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          attraction: '景点',
          hotel: '酒店',
          url: '自定义链接',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '关联内容',
      dataIndex: 'linkName',
      key: 'linkName',
      width: 150,
      render: (text: string, record: typeof banners[0]) => {
        if (record.linkType === 'url') {
          return record.linkId || '-';
        }
        return text || '-';
      },
    },
    {
      title: '排序',
      key: 'sort',
      width: 100,
      render: (_: unknown, record: typeof banners[0], index: number) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<ArrowUpOutlined />}
            disabled={index === 0}
            onClick={() => handleMoveUp(record, index)}
          />
          <Button
            type="text"
            size="small"
            icon={<ArrowDownOutlined />}
            disabled={index === banners.length - 1}
            onClick={() => handleMoveDown(record, index)}
          />
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (enabled: boolean, record: typeof banners[0]) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggleEnabled(record._id, checked)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: typeof banners[0]) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此 Banner？"
            onConfirm={() => handleDelete(record._id)}
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
        <h1 className="page-title">Banner 管理</h1>
      </div>

      <Card>
        <div className={styles.toolbar}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增 Banner
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={banners}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingBanner ? '编辑 Banner' : '新增 Banner'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Banner 图片" required>
            <div className={styles.imageUpload}>
              {imageUrl ? (
                <div className={styles.imagePreview}>
                  <Image
                    src={imageUrl}
                    width={200}
                    height={100}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                  />
                  <Button
                    size="small"
                    onClick={() => setImageSelectorOpen(true)}
                    style={{ marginTop: 8 }}
                  >
                    更换图片
                  </Button>
                </div>
              ) : (
                <div
                  className={styles.uploadBtn}
                  onClick={() => setImageSelectorOpen(true)}
                >
                  <PlusOutlined />
                  <span>选择图片</span>
                </div>
              )}
            </div>
          </Form.Item>

          <Form.Item name="title" label="标题（可选）">
            <Input placeholder="Banner 标题" maxLength={50} />
          </Form.Item>

          <Form.Item
            name="linkType"
            label="跳转类型"
            rules={[{ required: true, message: '请选择跳转类型' }]}
          >
            <Select
              options={[
                { value: 'attraction', label: '景点' },
                // { value: 'hotel', label: '酒店' },
                // { value: 'url', label: '自定义链接' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="linkId"
            label="关联景点"
            rules={[{ required: true, message: '请选择关联景点' }]}
          >
            <Select
              showSearch
              placeholder="请选择景点"
              optionFilterProp="label"
              options={attractions.map((a) => ({
                value: a._id,
                label: a.name,
              }))}
            />
          </Form.Item>

          <Form.Item name="sort" label="排序（数字越小越靠前）">
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="enabled" label="启用状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 图片选择弹窗 */}
      <ImageSelector
        open={imageSelectorOpen}
        onSelect={(url) => {
          setImageUrl(url);
          setImageSelectorOpen(false);
        }}
        onClose={() => setImageSelectorOpen(false)}
      />
    </div>
  );
};

export default BannersPage;
