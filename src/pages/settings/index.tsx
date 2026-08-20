import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, message, Select, Space, Switch, Table, Tabs, Tag } from 'antd';
import { adminCall } from '@/utils/adminApi';
import styles from './index.module.scss';

type DataEnv = 'dev' | 'test' | 'prod';
type TripVisibilityConfig = Record<DataEnv, boolean>;

const DEFAULT_VISIBILITY: TripVisibilityConfig = { dev: false, test: false, prod: false };
const ENV_OPTIONS = [
  { value: 'dev', label: '开发环境（dev）' },
  { value: 'test', label: '体验环境（test）' },
  { value: 'prod', label: '生产环境（prod）' },
];

const Settings: React.FC = () => {
  const [dataEnv, setDataEnv] = useState<DataEnv>('dev');
  const [tripVisibility, setTripVisibility] = useState<TripVisibilityConfig>(DEFAULT_VISIBILITY);
  const [visibilityLoading, setVisibilityLoading] = useState(true);
  const [visibilitySaving, setVisibilitySaving] = useState(false);

  const loadTripVisibility = useCallback(async () => {
    setVisibilityLoading(true);
    try {
      const result = await adminCall<{ config?: Partial<TripVisibilityConfig> }>('admin/tripListVisibilityGet');
      if (!result.success) throw new Error(result.error || '读取失败');
      setTripVisibility({ ...DEFAULT_VISIBILITY, ...(result.config || {}) });
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取行程展示设置失败');
    } finally {
      setVisibilityLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTripVisibility();
  }, [loadTripVisibility]);

  const updateTripVisibility = async (enabled: boolean) => {
    setVisibilitySaving(true);
    try {
      const result = await adminCall<{ config?: Partial<TripVisibilityConfig> }>('admin/tripListVisibilityUpdate', {
        dataEnv,
        enabled,
      });
      if (!result.success) throw new Error(result.error || '保存失败');
      setTripVisibility({ ...DEFAULT_VISIBILITY, ...(result.config || {}), [dataEnv]: enabled });
      message.success(enabled ? '已开启往期行程展示' : '已关闭往期行程展示');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存行程展示设置失败');
    } finally {
      setVisibilitySaving(false);
    }
  };

  const roleColumns = [
    { title: '角色名称', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '成员数', dataIndex: 'memberCount', key: 'memberCount' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作',
      key: 'action',
      render: () => <Button type="link" size="small">编辑权限</Button>,
    },
  ];

  const logColumns = [
    { title: '操作人', dataIndex: 'operator', key: 'operator' },
    { title: '操作类型', dataIndex: 'action', key: 'action' },
    { title: '操作对象', dataIndex: 'target', key: 'target' },
    { title: '操作时间', dataIndex: 'createdAt', key: 'createdAt' },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip' },
  ];

  const items = [
    {
      key: 'basic',
      label: '基本设置',
      children: (
        <Space direction="vertical" size={24} className={styles.settingsContent}>
          <Card title="行程列表运营设置" className={styles.settingCard}>
            <Alert
              type="info"
              showIcon
              message="此设置按业务数据环境独立生效"
              description="关闭时，公共行程列表只返回今天及以后的行程；开启后，当前行程展示完毕后继续展示往期行程。我的行程和个人主页不受影响。"
              className={styles.settingAlert}
            />
            <Form layout="vertical">
              <Form.Item label="配置环境">
                <Select<DataEnv>
                  value={dataEnv}
                  options={ENV_OPTIONS}
                  onChange={setDataEnv}
                  className={styles.envSelect}
                />
              </Form.Item>
              <Form.Item label="公开列表展示往期行程">
                <Space size={12}>
                  <Switch
                    checked={tripVisibility[dataEnv]}
                    loading={visibilityLoading || visibilitySaving}
                    disabled={visibilityLoading || visibilitySaving}
                    onChange={updateTripVisibility}
                  />
                  <Tag color={tripVisibility[dataEnv] ? 'green' : 'default'}>
                    {tripVisibility[dataEnv] ? '已开启' : '已关闭'}
                  </Tag>
                </Space>
                <div className={styles.settingHelp}>
                  往期行程统一显示“已结束”，仍可查看、评论和分享，但不能申请加入。
                </div>
              </Form.Item>
            </Form>
          </Card>

          <Card title="基础信息" className={styles.settingCard}>
            <Form layout="vertical" style={{ maxWidth: 600 }}>
              <Form.Item label="系统名称">
                <Input defaultValue="北京旅行后台管理系统" />
              </Form.Item>
              <Form.Item label="系统Logo">
                <Input defaultValue="🏔️" />
              </Form.Item>
              <Form.Item label="开启注册">
                <Switch defaultChecked />
              </Form.Item>
              <Form.Item>
                <Button type="primary">保存设置</Button>
              </Form.Item>
            </Form>
          </Card>
        </Space>
      ),
    },
    {
      key: 'roles',
      label: '角色权限',
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary">新增角色</Button>
          </div>
          <Table
            columns={roleColumns}
            dataSource={[
              { key: '1', name: '超级管理员', description: '拥有所有权限', memberCount: 2, createdAt: '2026-01-01' },
              { key: '2', name: '运营人员', description: '管理内容和订单', memberCount: 10, createdAt: '2026-01-15' },
              { key: '3', name: '客服人员', description: '处理用户反馈', memberCount: 5, createdAt: '2026-02-01' },
            ]}
            pagination={false}
          />
        </div>
      ),
    },
    {
      key: 'logs',
      label: '操作日志',
      children: (
        <Table
          columns={logColumns}
          dataSource={[]}
          rowKey="id"
        />
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className="page-header">
        <h1 className="page-title">系统设置</h1>
      </div>

      <Card>
        <Tabs items={items} />
      </Card>
    </div>
  );
};

export default Settings;
