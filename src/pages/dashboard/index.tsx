import React from 'react';
import { Card, Row, Col, Table, Progress } from 'antd';
import {
  UserOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  MessageOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { mockDashboardData } from '@/mock/attractions';
import styles from './index.module.scss';

const Dashboard: React.FC = () => {
  const { stats, trendData, hotAttractions } = mockDashboardData;

  const statCards = [
    {
      title: '今日 DAU',
      value: stats.dau.toLocaleString(),
      change: stats.dauChange,
      icon: <UserOutlined />,
      color: 'var(--primary-500)',
    },
    {
      title: '今日订单',
      value: stats.orders.toLocaleString(),
      change: stats.ordersChange,
      icon: <ShoppingCartOutlined />,
      color: 'var(--success-500)',
    },
    {
      title: '今日 GMV',
      value: `¥${stats.gmv.toLocaleString()}`,
      change: stats.gmvChange,
      icon: <DollarOutlined />,
      color: 'var(--warning-500)',
    },
    {
      title: '待处理反馈',
      value: stats.pendingFeedback,
      change: 0,
      icon: <MessageOutlined />,
      color: 'var(--error-500)',
      isPending: true,
    },
  ];

  const columns = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: '景点名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '浏览量',
      dataIndex: 'viewCount',
      key: 'viewCount',
      render: (value: number) => value.toLocaleString(),
    },
  ];

  return (
    <div className={styles.dashboard}>
      <div className="page-header">
        <h1 className="page-title">数据概览</h1>
        <p className="page-subtitle">实时运营数据监控</p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} className={styles.statCards}>
        {statCards.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                {stat.icon}
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>{stat.title}</p>
                <p className={styles.statValue}>{stat.value}</p>
                {!stat.isPending && (
                  <p className={styles.statChange} style={{ color: stat.change >= 0 ? 'var(--success-500)' : 'var(--error-500)' }}>
                    {stat.change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    <span>{Math.abs(stat.change)}%</span>
                  </p>
                )}
                {stat.isPending && (
                  <p className={styles.statChange} style={{ color: 'var(--warning-500)' }}>
                    待处理
                  </p>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 趋势图表 */}
      <Card className={styles.chartCard} title="访问趋势（近7天）">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
            <XAxis dataKey="date" stroke="var(--gray-500)" />
            <YAxis yAxisId="left" stroke="var(--gray-500)" />
            <YAxis yAxisId="right" orientation="right" stroke="var(--gray-500)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius-md)',
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="dau"
              name="DAU"
              stroke="var(--primary-500)"
              strokeWidth={2}
              dot={{ fill: 'var(--primary-500)' }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="orders"
              name="订单量"
              stroke="var(--success-500)"
              strokeWidth={2}
              dot={{ fill: 'var(--success-500)' }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="gmv"
              name="GMV(元)"
              stroke="var(--warning-500)"
              strokeWidth={2}
              dot={{ fill: 'var(--warning-500)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* 热门景点排行 */}
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card className={styles.rankCard} title="热门景点排行">
            <Table
              dataSource={hotAttractions}
              columns={columns}
              pagination={false}
              size="small"
              rowKey="name"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className={styles.rankCard} title="运营数据概览">
            <div className={styles.progressList}>
              <div className={styles.progressItem}>
                <div className={styles.progressLabel}>
                  <span>景点上线率</span>
                  <span>85%</span>
                </div>
                <Progress percent={85} showInfo={false} strokeColor="var(--primary-500)" />
              </div>
              <div className={styles.progressItem}>
                <div className={styles.progressLabel}>
                  <span>订单完成率</span>
                  <span>92%</span>
                </div>
                <Progress percent={92} showInfo={false} strokeColor="var(--success-500)" />
              </div>
              <div className={styles.progressItem}>
                <div className={styles.progressLabel}>
                  <span>用户满意度</span>
                  <span>4.5/5</span>
                </div>
                <Progress percent={90} showInfo={false} strokeColor="var(--warning-500)" />
              </div>
              <div className={styles.progressItem}>
                <div className={styles.progressLabel}>
                  <span>反馈处理率</span>
                  <span>78%</span>
                </div>
                <Progress percent={78} showInfo={false} strokeColor="var(--error-500)" />
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
