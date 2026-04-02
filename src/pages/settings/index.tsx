import React from 'react';
import { Card, Tabs, Form, Input, Button, Switch, Select, Divider, Table } from 'antd';
import styles from './index.module.scss';

const Settings: React.FC = () => {
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
