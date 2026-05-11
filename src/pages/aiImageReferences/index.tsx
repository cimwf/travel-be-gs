import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Image,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  DeleteOutlined,
  PictureOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import app, { getDb, initCloudBase } from '@/utils/cloudbase';
import styles from './index.module.scss';

const PAGE_SIZE = 100;
const TEMP_URL_CHUNK_SIZE = 50;
const DAY_MS = 24 * 60 * 60 * 1000;
const REFERENCE_PREFIX = 'ai-references/';

interface AIReferenceItem {
  _id: string;
  responseId: string;
  userId: string;
  prompt: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  referenceFileID: string;
  referenceUrl: string;
}

interface AIReferenceRecord {
  _id?: string;
  responseId?: string;
  userId?: string;
  prompt?: string;
  status?: string;
  createdAt?: number;
  updatedAt?: number;
  referenceFileID?: string;
}

interface TempFileItem {
  fileID?: string;
  tempFileURL?: string;
}

function formatTime(value?: number) {
  return value ? new Date(value).toLocaleString() : '-';
}

function getAgeLabel(createdAt?: number) {
  if (!createdAt) return '-';
  const diff = Date.now() - createdAt;
  const days = Math.floor(diff / DAY_MS);
  if (days <= 0) {
    const hours = Math.max(1, Math.floor(diff / (60 * 60 * 1000)));
    return `${hours} 小时前`;
  }
  return `${days} 天前`;
}

function isAiReferenceFile(fileID?: string) {
  if (!fileID || typeof fileID !== 'string') return false;
  const normalized = fileID.replace(/^cloud:\/\/[^/]+\//, '');
  return normalized.startsWith(REFERENCE_PREFIX);
}

function mapRecordToItem(record: AIReferenceRecord, tempUrlMap: Map<string, string>): AIReferenceItem {
  const referenceFileID = String(record.referenceFileID || '');
  return {
    _id: String(record._id || ''),
    responseId: String(record.responseId || ''),
    userId: String(record.userId || ''),
    prompt: String(record.prompt || ''),
    status: String(record.status || ''),
    createdAt: Number(record.createdAt || 0),
    updatedAt: Number(record.updatedAt || 0),
    referenceFileID,
    referenceUrl: tempUrlMap.get(referenceFileID) || '',
  };
}

async function buildTempUrlMap(fileIDs: string[]) {
  const tempUrlMap = new Map<string, string>();
  const uniqueFileIDs = [...new Set(fileIDs.filter(Boolean))];

  for (let i = 0; i < uniqueFileIDs.length; i += TEMP_URL_CHUNK_SIZE) {
    const fileList = uniqueFileIDs.slice(i, i + TEMP_URL_CHUNK_SIZE);
    const result = await app.getTempFileURL({ fileList });
    const items = ((result as { fileList?: TempFileItem[] }).fileList || []);

    items.forEach((item) => {
      if (item.fileID && item.tempFileURL) {
        tempUrlMap.set(item.fileID, item.tempFileURL);
      }
    });
  }

  return tempUrlMap;
}

const AIImageReferencesPage: React.FC = () => {
  const [items, setItems] = useState<AIReferenceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [cleanupDays, setCleanupDays] = useState<number | null>(null);

  const loadAllReferences = useCallback(async () => {
    setLoading(true);
    try {
      await initCloudBase();
      const db = getDb();
      const _ = db.command;
      const merged: AIReferenceRecord[] = [];
      let page = 0;

      while (true) {
        const result = await db.collection('ai_image_generations')
          .where({
            mode: 'image',
            referenceFileID: _.neq(''),
          })
          .orderBy('createdAt', 'desc')
          .skip(page * PAGE_SIZE)
          .limit(PAGE_SIZE)
          .get();

        const pageRecords = (result.data || []) as AIReferenceRecord[];
        if (!pageRecords.length) {
          break;
        }

        merged.push(...pageRecords);
        if (pageRecords.length < PAGE_SIZE) {
          break;
        }

        page += 1;
      }

      const records = merged.filter((record) => isAiReferenceFile(record.referenceFileID));
      const tempUrlMap = await buildTempUrlMap(records.map((record) => String(record.referenceFileID || '')));
      setItems(records.map((record) => mapRecordToItem(record, tempUrlMap)));
    } catch (error) {
      console.error('Load AI references error:', error);
      message.error('加载 AI 参考图失败');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllReferences();
  }, [loadAllReferences]);

  const olderThan2DaysCount = useMemo(
    () => items.filter((item) => item.createdAt && Date.now() - item.createdAt >= 2 * DAY_MS).length,
    [items]
  );

  const olderThan7DaysCount = useMemo(
    () => items.filter((item) => item.createdAt && Date.now() - item.createdAt >= 7 * DAY_MS).length,
    [items]
  );

  const handleCleanup = async (days: number) => {
    setCleanupDays(days);
    try {
      await initCloudBase();
      const db = getDb();
      const threshold = Date.now() - days * DAY_MS;
      const targets = items.filter((item) => item.createdAt && item.createdAt < threshold);

      if (!targets.length) {
        message.info(`没有 ${days} 天前的参考图需要清理`);
        return;
      }

      const fileIDs = [...new Set(targets.map((item) => item.referenceFileID).filter(Boolean))];
      if (fileIDs.length) {
        await app.deleteFile({ fileList: fileIDs });
      }

      const updatedAt = Date.now();
      await Promise.all(
        targets.map((item) => db.collection('ai_image_generations').doc(item._id).update({
          referenceFileID: '',
          updatedAt,
          referenceDeletedAt: updatedAt,
        }))
      );

      message.success(`已清理 ${days} 天前参考图，删除 ${fileIDs.length} 张，更新 ${targets.length} 条记录`);
      await loadAllReferences();
    } catch (error) {
      console.error('Cleanup AI references error:', error);
      message.error('清理 AI 参考图失败');
    } finally {
      setCleanupDays(null);
    }
  };

  const stats = [
    { label: '当前参考图', value: items.length, tone: styles.statNeutral },
    { label: '2 天前可删', value: olderThan2DaysCount, tone: styles.statWarn },
    { label: '7 天前可删', value: olderThan7DaysCount, tone: styles.statDanger },
  ];

  return (
    <div className={styles.container}>
      <Card
        title="AI 参考图"
        extra={(
          <Space wrap>
            <Popconfirm
              title="删除 2 天前参考图"
              description={`将删除 ${olderThan2DaysCount} 张 2 天前的参考图，并清空对应记录中的 referenceFileID。`}
              okText="确认删除"
              cancelText="取消"
              onConfirm={() => handleCleanup(2)}
              disabled={!olderThan2DaysCount}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={cleanupDays === 2}
                disabled={!olderThan2DaysCount}
              >
                删除 2 天前
              </Button>
            </Popconfirm>
            <Popconfirm
              title="删除 7 天前参考图"
              description={`将删除 ${olderThan7DaysCount} 张 7 天前的参考图，并清空对应记录中的 referenceFileID。`}
              okText="确认删除"
              cancelText="取消"
              onConfirm={() => handleCleanup(7)}
              disabled={!olderThan7DaysCount}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={cleanupDays === 7}
                disabled={!olderThan7DaysCount}
              >
                删除 7 天前
              </Button>
            </Popconfirm>
            <Button icon={<ReloadOutlined />} onClick={loadAllReferences} loading={loading}>
              刷新
            </Button>
          </Space>
        )}
      >
        <div className={styles.statsRow}>
          {stats.map((stat) => (
            <div key={stat.label} className={`${styles.statItem} ${stat.tone}`}>
              <div className={styles.statLabel}>{stat.label}</div>
              <div className={styles.statValue}>{stat.value}</div>
            </div>
          ))}
        </div>

        <Spin spinning={loading}>
          {!items.length ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="ai-references 暂时没有可展示的参考图"
            />
          ) : (
            <div className={styles.grid}>
              {items.map((item) => (
                <div key={item._id} className={styles.card}>
                  <div className={styles.preview}>
                    {item.referenceUrl ? (
                      <Image
                        src={item.referenceUrl}
                        alt={item.responseId || item.referenceFileID}
                        className={styles.image}
                      />
                    ) : (
                      <div className={styles.placeholder}>
                        <PictureOutlined />
                        <span>链接已失效</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.meta}>
                    <div className={styles.metaHeader}>
                      <Typography.Text strong ellipsis={{ tooltip: item.responseId || item.referenceFileID }}>
                        {item.responseId || item.referenceFileID}
                      </Typography.Text>
                      <Tag color={item.status === 'succeeded' ? 'green' : 'default'}>
                        {item.status || 'unknown'}
                      </Tag>
                    </div>

                    <Typography.Paragraph
                      className={styles.prompt}
                      ellipsis={{ rows: 2, tooltip: item.prompt || '-' }}
                    >
                      {item.prompt || '无提示词'}
                    </Typography.Paragraph>

                    <div className={styles.metaRow}>
                      <span className={styles.metaLabel}>创建时间</span>
                      <span>{formatTime(item.createdAt)}</span>
                    </div>
                    <div className={styles.metaRow}>
                      <span className={styles.metaLabel}>保留时长</span>
                      <span>{getAgeLabel(item.createdAt)}</span>
                    </div>
                    <div className={styles.metaRow}>
                      <span className={styles.metaLabel}>用户</span>
                      <span className={styles.metaValue} title={item.userId || '-'}>
                        {item.userId || '-'}
                      </span>
                    </div>
                    <div className={styles.metaRow}>
                      <span className={styles.metaLabel}>文件 ID</span>
                      <span className={styles.metaValue} title={item.referenceFileID || '-'}>
                        {item.referenceFileID || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default AIImageReferencesPage;
