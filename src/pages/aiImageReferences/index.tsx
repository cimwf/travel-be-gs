import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, Popconfirm, Spin, Typography, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import app, { getDb, initCloudBase } from '@/utils/cloudbase';
import styles from './index.module.scss';

const PAGE_SIZE = 100;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const REFERENCE_PREFIX = 'ai-references/';

interface AIReferenceItem {
  _id: string;
  createdAt: number;
  referenceFileID: string;
}

interface AIReferenceRecord {
  _id?: string;
  createdAt?: number;
  referenceFileID?: string;
}

function isAiReferenceFile(fileID?: string) {
  if (!fileID || typeof fileID !== 'string') return false;
  const normalized = fileID.replace(/^cloud:\/\/[^/]+\//, '');
  return normalized.startsWith(REFERENCE_PREFIX);
}

function getThresholdLabel(hoursOrDays: number, unit: 'hour' | 'day') {
  return unit === 'hour' ? `${hoursOrDays} 小时前` : `${hoursOrDays} 天前`;
}

const AIImageReferencesPage: React.FC = () => {
  const [items, setItems] = useState<AIReferenceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [cleanupKey, setCleanupKey] = useState<'all' | '2d' | '7d' | null>(null);

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

      const records = merged
        .filter((record) => isAiReferenceFile(record.referenceFileID))
        .map((record) => ({
          _id: String(record._id || ''),
          createdAt: Number(record.createdAt || 0),
          referenceFileID: String(record.referenceFileID || ''),
        }));

      setItems(records);
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

  const olderThan2HoursCount = useMemo(
    () => items.filter((item) => item.createdAt && Date.now() - item.createdAt >= 2 * HOUR_MS).length,
    [items]
  );

  const olderThan2DaysCount = useMemo(
    () => items.filter((item) => item.createdAt && Date.now() - item.createdAt >= 2 * DAY_MS).length,
    [items]
  );

  const olderThan7DaysCount = useMemo(
    () => items.filter((item) => item.createdAt && Date.now() - item.createdAt >= 7 * DAY_MS).length,
    [items]
  );

  const handleCleanup = async (
    thresholdMs: number,
    cleanupValue: 'all' | '2d' | '7d',
    label: string
  ) => {
    setCleanupKey(cleanupValue);
    try {
      await initCloudBase();
      const db = getDb();
      const threshold = Date.now() - thresholdMs;
      const targets = items.filter((item) => item.createdAt && item.createdAt < threshold);

      if (!targets.length) {
        message.info(`没有 ${label}的参考图需要清理`);
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

      message.success(`已清理 ${label}参考图，删除 ${fileIDs.length} 张，更新 ${targets.length} 条记录`);
      await loadAllReferences();
    } catch (error) {
      console.error('Cleanup AI references error:', error);
      message.error('清理 AI 参考图失败');
    } finally {
      setCleanupKey(null);
    }
  };

  const stats = [
    { label: '参考图总数', value: items.length, tone: styles.statNeutral },
    { label: '全部可删', value: olderThan2HoursCount, desc: '2 小时前', tone: styles.statInfo },
    { label: '2 天前可删', value: olderThan2DaysCount, desc: '2 天前', tone: styles.statWarn },
    { label: '1 周前可删', value: olderThan7DaysCount, desc: '7 天前', tone: styles.statDanger },
  ];

  return (
    <div className={styles.container}>
      <Card title="AI 参考图">
        <div className={styles.statsRow}>
          {stats.map((stat) => (
            <div key={stat.label} className={`${styles.statItem} ${stat.tone}`}>
              <div className={styles.statLabel}>{stat.label}</div>
              <div className={styles.statValue}>{stat.value}</div>
              {stat.desc ? <div className={styles.statDesc}>统计范围：{stat.desc}</div> : null}
            </div>
          ))}
        </div>

        <Spin spinning={loading}>
          <div className={styles.actions}>
            <Popconfirm
              title="全部删除"
              description={`将删除 ${olderThan2HoursCount} 张 ${getThresholdLabel(2, 'hour')}的参考图，并清空对应记录中的 referenceFileID。`}
              okText="确认删除"
              cancelText="取消"
              onConfirm={() => handleCleanup(2 * HOUR_MS, 'all', getThresholdLabel(2, 'hour'))}
              disabled={!olderThan2HoursCount}
            >
              <Button
                danger
                size="large"
                icon={<DeleteOutlined />}
                loading={cleanupKey === 'all'}
                disabled={!olderThan2HoursCount}
              >
                全部删除（{olderThan2HoursCount}）
              </Button>
            </Popconfirm>

            <Popconfirm
              title="删除两天前"
              description={`将删除 ${olderThan2DaysCount} 张 ${getThresholdLabel(2, 'day')}的参考图，并清空对应记录中的 referenceFileID。`}
              okText="确认删除"
              cancelText="取消"
              onConfirm={() => handleCleanup(2 * DAY_MS, '2d', getThresholdLabel(2, 'day'))}
              disabled={!olderThan2DaysCount}
            >
              <Button
                danger
                size="large"
                icon={<DeleteOutlined />}
                loading={cleanupKey === '2d'}
                disabled={!olderThan2DaysCount}
              >
                删除两天前（{olderThan2DaysCount}）
              </Button>
            </Popconfirm>

            <Popconfirm
              title="删除一周前"
              description={`将删除 ${olderThan7DaysCount} 张 ${getThresholdLabel(7, 'day')}的参考图，并清空对应记录中的 referenceFileID。`}
              okText="确认删除"
              cancelText="取消"
              onConfirm={() => handleCleanup(7 * DAY_MS, '7d', getThresholdLabel(7, 'day'))}
              disabled={!olderThan7DaysCount}
            >
              <Button
                danger
                size="large"
                icon={<DeleteOutlined />}
                loading={cleanupKey === '7d'}
                disabled={!olderThan7DaysCount}
              >
                删除一周前（{olderThan7DaysCount}）
              </Button>
            </Popconfirm>
          </div>

          {!items.length ? (
            <Empty
              className={styles.empty}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="当前没有 AI 参考图"
            />
          ) : (
            <Typography.Text className={styles.summary}>
              当前共有 {items.length} 条参考图，其中 2 小时前 {olderThan2HoursCount} 条，2 天前 {olderThan2DaysCount} 条，1 周前 {olderThan7DaysCount} 条。
            </Typography.Text>
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default AIImageReferencesPage;
