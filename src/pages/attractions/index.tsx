import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Select, Tag, Space, Popconfirm, message, Image, Modal, Typography } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, UpOutlined, DownOutlined, SyncOutlined, CopyOutlined, ImportOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAttractionsStore } from '@/stores/attractions';
import { categoryOptions, locationOptions } from '@/mock/attractions';
import type { Attraction } from '@/types';
import styles from './index.module.scss';

const { TextArea } = Input;
const { Paragraph } = Typography;

const difficultyColorMap: Record<string, string> = {
  '简单': 'success',
  '中等': 'warning',
  '困难': 'error',
};

const AttractionsList: React.FC = () => {
  const navigate = useNavigate();
  const { fetchList, delete: deleteAttraction, updateSortOrder, initSortOrder, batchCreate } = useAttractionsStore();

  const [data, setData] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [location, setLocation] = useState('all');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJson, setImportJson] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchList({ page, pageSize, keyword, category, location });
      setData(result.list);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, keyword, category, location]);

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

  const handleMoveUp = async (record: Attraction) => {
    const currentIndex = data.findIndex(item => item._id === record._id);
    if (currentIndex <= 0) return;

    const prevItem = data[currentIndex - 1];

    // 使用临时值避免冲突：先设成一个大负数
    await updateSortOrder(record._id!, -1000);
    await updateSortOrder(prevItem._id!, record.sortOrder);
    await updateSortOrder(record._id!, prevItem.sortOrder);

    message.success('上移成功');
    loadData();
  };

  const handleMoveDown = async (record: Attraction) => {
    const currentIndex = data.findIndex(item => item._id === record._id);
    if (currentIndex >= data.length - 1) return;

    const nextItem = data[currentIndex + 1];

    // 使用临时值避免冲突：先设成一个大数
    await updateSortOrder(record._id!, 10000);
    await updateSortOrder(nextItem._id!, record.sortOrder);
    await updateSortOrder(record._id!, nextItem.sortOrder);

    message.success('下移成功');
    loadData();
  };

  const handleInitSortOrder = async () => {
    const result = await initSortOrder();
    if (result.success) {
      message.success(result.message);
      loadData();
    } else {
      message.error(result.message);
    }
  };

  // 导出单条数据为 JSON
  const handleExportJson = (record: Attraction) => {
    const exportData = { ...record };
    delete (exportData as { _id?: string })._id;
    const jsonStr = JSON.stringify(exportData, null, 2);

    navigator.clipboard.writeText(jsonStr).then(() => {
      message.success('JSON 已复制到剪贴板');
    }).catch(() => {
      // 降级方案：创建下载
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${record.name}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  // 导出所有数据为 JSON
  const handleExportAllJson = () => {
    const exportData = data.map(item => {
      const obj = { ...item };
      delete (obj as { _id?: string })._id;
      return obj;
    });
    const jsonStr = JSON.stringify(exportData, null, 2);

    navigator.clipboard.writeText(jsonStr).then(() => {
      message.success(`已复制 ${exportData.length} 条数据的 JSON 到剪贴板`);
    }).catch(() => {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'attractions.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  // 导入 JSON 数据
  const handleImportJson = async () => {
    try {
      const parsed = JSON.parse(importJson);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      // 验证必要字段
      const validItems = items.filter(item => item.name && item.category);

      if (validItems.length === 0) {
        message.error('没有有效的景点数据，请确保包含 name 和 category 字段');
        return;
      }

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
    }
  };

  // 字段说明文本
  const fieldDescription = `景点数据字段说明：

【必填字段】
- name: 景点名称，字符串类型
- category: 分类，可选值：爬山、水上、古镇、露营
- location: 所在区域，如：门头沟区、延庆区等
- distance: 距离市中心的公里数，数字类型
- difficulty: 难度，可选值：简单、中等、困难
- duration: 游玩时长，如：1天、半天
- bestSeason: 最佳季节，如：春秋、四季
- openTime: 开放时间，如：全天开放、8:00-17:00
- description: 景点描述，字符串

【可选字段 - 基础信息】
- intro: 一句话简介，如：北京最高峰，云海日出+高山草甸
- difficultyDesc: 难度描述，如：路线较长且爬升明显，对体力要求较高
- timeCostDetail: 时间详情，如：单程登顶约4-6小时
- altitude: 海拔，如：2303m
- cost: 费用，如：人均50-100元
- transport: 交通，如：建议自驾，导航至xxx
- rating: 评分，数字0-5

【可选字段 - 图片】
- coverImage: 封面图URL
- images: 图片URL数组，如：["图片1", "图片2"]

【可选字段 - 数组】
- tags: 标签数组，如：["日出", "云海"]
- tipsList: 温馨提示数组，如：["提示1", "提示2"]
- highlight: 亮点数组，如：["北京最高峰", "震撼云海日出"]
- features: 特色数组，如：["云海概率很高", "适合看日出"]
- suitableFor: 适合人群数组，如：["户外徒步爱好者", "摄影爱好者"]
- avoidFor: 不适合人群数组，如：["新手小白", "体力较差人群"]

【可选字段 - 统计】
- wantCount: 想去人数，数字，默认0
- visitCount: 访问人数，数字，默认0
- tripCount: 行程数，数字，默认0

【JSON示例】
{
  "name": "东灵山",
  "category": "爬山",
  "location": "门头沟区",
  "distance": 120,
  "difficulty": "困难",
  "difficultyDesc": "路线较长且爬升明显，对体力要求较高",
  "duration": "1天",
  "timeCostDetail": "单程登顶约4-6小时，建议凌晨出发看日出",
  "bestSeason": "春夏秋",
  "openTime": "全天开放",
  "intro": "北京最高峰，云海日出+高山草甸，徒步天花板",
  "description": "想挑战北京最高峰？东灵山绝对值得一去...",
  "cost": "人均50-100元",
  "transport": "建议自驾，导航至东灵山登山口",
  "rating": 4.8,
  "altitude": "2303m",
  "coverImage": "https://example.com/cover.jpg",
  "images": ["https://example.com/1.jpg"],
  "tags": ["日出", "云海", "露营"],
  "tipsList": ["山顶气温较低，建议携带保暖衣物"],
  "highlight": ["北京最高峰", "震撼云海日出"],
  "features": ["云海概率很高", "适合看日出"],
  "suitableFor": ["户外徒步爱好者"],
  "avoidFor": ["新手小白"]
}`;

  const handleCopyFieldDescription = () => {
    navigator.clipboard.writeText(fieldDescription).then(() => {
      message.success('字段说明已复制到剪贴板');
    }).catch(() => {
      Modal.info({
        title: '景点字段说明',
        width: 700,
        content: (
          <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13 }}>
            {fieldDescription}
          </div>
        ),
      });
    });
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
      width: 150,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 80,
    },
    {
      title: '区域',
      dataIndex: 'location',
      key: 'location',
      width: 100,
    },
    {
      title: '距离',
      dataIndex: 'distance',
      key: 'distance',
      width: 80,
      render: (v: number) => `${v}km`,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 80,
      render: (v: string) => (
        <Tag color={difficultyColorMap[v] || 'default'}>{v}</Tag>
      ),
    },
    {
      title: '想去/访问',
      key: 'counts',
      width: 120,
      render: (_: unknown, record: Attraction) => (
        <span>
          {record.wantCount}/{record.visitCount}
        </span>
      ),
    },
    {
      title: '最佳季节',
      dataIndex: 'bestSeason',
      key: 'bestSeason',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      render: (_: unknown, record: Attraction, index: number) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<UpOutlined />}
            disabled={index === 0}
            onClick={() => handleMoveUp(record)}
          >
            上移
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DownOutlined />}
            disabled={index === data.length - 1}
            onClick={() => handleMoveDown(record)}
          >
            下移
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleExportJson(record)}
          >
            JSON
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/attractions/edit/${record._id}`)}
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
        <h1 className="page-title">景点管理</h1>
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
            <Select
              value={category}
              onChange={setCategory}
              style={{ width: 120 }}
              options={[
                { value: 'all', label: '全部分类' },
                ...categoryOptions,
              ]}
            />
            <Select
              value={location}
              onChange={setLocation}
              style={{ width: 120 }}
              options={[
                { value: 'all', label: '全部区域' },
                ...locationOptions.map((l) => ({ value: l, label: l })),
              ]}
            />
          </div>
          <Space>
            <Button icon={<QuestionCircleOutlined />} onClick={handleCopyFieldDescription}>
              字段说明
            </Button>
            <Button icon={<CopyOutlined />} onClick={handleExportAllJson}>
              导出JSON
            </Button>
            <Button icon={<ImportOutlined />} onClick={() => setImportModalOpen(true)}>
              批量导入
            </Button>
            <Popconfirm
              title="初始化排序将按创建时间为所有景点重新排序，确定执行吗？"
              onConfirm={handleInitSortOrder}
              okText="确定"
              cancelText="取消"
            >
              <Button icon={<SyncOutlined />}>
                初始化排序
              </Button>
            </Popconfirm>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/attractions/create')}
            >
              新增景点
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data}
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

      {/* 批量导入 Modal */}
      <Modal
        title="批量导入景点"
        open={importModalOpen}
        onCancel={() => {
          setImportModalOpen(false);
          setImportJson('');
        }}
        onOk={handleImportJson}
        okText="导入"
        cancelText="取消"
        width={700}
      >
        <div style={{ marginBottom: 12 }}>
          <p style={{ color: '#666', marginBottom: 8 }}>
            请粘贴 JSON 数据，支持单个景点对象或数组格式。必填字段：name、category
          </p>
          <p style={{ color: '#999', fontSize: 12 }}>
            参考格式：
            <code style={{ background: '#f5f5f5', padding: '2px 6px', marginLeft: 4 }}>
              {"{ \"name\": \"景点名\", \"category\": \"爬山\", ... }"}
            </code>
          </p>
        </div>
        <TextArea
          rows={15}
          placeholder='{"name": "景点名", "category": "爬山", "location": "区域", ...}'
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default AttractionsList;
