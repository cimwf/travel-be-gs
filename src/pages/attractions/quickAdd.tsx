import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, message, Image, Modal, Tabs } from 'antd';
import { PlusOutlined, ArrowLeftOutlined, ImportOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuickAttractionsStore } from '@/stores/quickAttractions';
import { locationOptions } from '@/mock/attractions';
import ImageSelector from '@/components/ImageSelector';
import styles from './quickAdd.module.scss';

const { TextArea } = Input;

const QuickAdd: React.FC = () => {
  const navigate = useNavigate();
  const { create, batchCreate } = useQuickAttractionsStore();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [imageSelectorOpen, setImageSelectorOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJson, setImportJson] = useState('');

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!coverUrl) {
        message.error('请选择景点封面');
        return;
      }

      setSubmitting(true);

      const result = await create({
        name: values.name,
        location: values.location,
        coverImage: coverUrl,
      });

      if (result.success) {
        message.success(result.message);
        form.resetFields();
        setCoverUrl('');
        navigate('/attractions/quickList');
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setSubmitting(false);
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

      setSubmitting(true);
      const result = await batchCreate(validItems);

      if (result.success) {
        message.success(result.message);
        setImportModalOpen(false);
        setImportJson('');
        navigate('/attractions/quickList');
      } else {
        message.error(result.message);
      }
    } catch {
      message.error('JSON 格式错误，请检查');
    } finally {
      setSubmitting(false);
    }
  };

  const jsonExample = `[
  {
    "name": "景点名称1",
    "location": "门头沟区",
    "coverImage": "https://example.com/image1.jpg"
  },
  {
    "name": "景点名称2",
    "location": "延庆区",
    "coverImage": "https://example.com/image2.jpg"
  }
]`;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/attractions')}>
          返回列表
        </Button>
        <h1 className={styles.title}>快速添加景点</h1>
      </div>

      <Card className={styles.card}>
        <Form form={form} layout="vertical">
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

          <Form.Item label="景点封面" required>
            <div className={styles.coverUpload}>
              {coverUrl ? (
                <div className={styles.coverPreview}>
                  <Image
                    src={coverUrl}
                    width={200}
                    height={150}
                    style={{ objectFit: 'cover', borderRadius: 8 }}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                  />
                  <div className={styles.coverActions}>
                    <Button size="small" onClick={() => setImageSelectorOpen(true)}>
                      更换封面
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={styles.coverUploader}
                  onClick={() => setImageSelectorOpen(true)}
                >
                  <PlusOutlined />
                  <div className={styles.uploaderText}>选择图片</div>
                </div>
              )}
              <div className={styles.uploadHint}>建议尺寸 400x300</div>
            </div>
          </Form.Item>

          <Form.Item>
            <div className={styles.actions}>
              <Button icon={<ImportOutlined />} onClick={() => setImportModalOpen(true)}>
                JSON导入
              </Button>
              <div style={{ flex: 1 }} />
              <Button onClick={() => navigate('/attractions')}>取消</Button>
              <Button type="primary" loading={submitting} onClick={handleSubmit}>
                添加景点
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>

      {/* 图片选择弹窗 */}
      <ImageSelector
        open={imageSelectorOpen}
        onSelect={(url) => {
          setCoverUrl(url);
          setImageSelectorOpen(false);
        }}
        onClose={() => setImageSelectorOpen(false)}
      />

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
        width={700}
        confirmLoading={submitting}
      >
        <Tabs
          items={[
            {
              key: 'input',
              label: '粘贴JSON',
              children: (
                <>
                  <p style={{ color: '#666', marginBottom: 8 }}>
                    请粘贴 JSON 数据，支持单个景点对象或数组格式。必填字段：name
                  </p>
                  <TextArea
                    rows={12}
                    placeholder='{"name": "景点名", "location": "区域", "coverImage": "图片URL"}'
                    value={importJson}
                    onChange={(e) => setImportJson(e.target.value)}
                  />
                </>
              ),
            },
            {
              key: 'example',
              label: '示例格式',
              children: (
                <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, overflow: 'auto' }}>
                  {jsonExample}
                </pre>
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
};

export default QuickAdd;
