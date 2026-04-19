import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Progress, Spin, Segmented } from 'antd';
import {
  EyeOutlined,
  UserOutlined,
  CalendarOutlined,
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
  BarChart,
  Bar,
} from 'recharts';
import { useViewStatsStore } from '@/stores/viewStats';
import { useFeedbackStore } from '@/stores/feedback';
import { useUsersStore } from '@/stores/users';
import { useAttractionsStore } from '@/stores/attractions';
import styles from './index.module.scss';

const Dashboard: React.FC = () => {
  const {
    totalViews,
    todayViews,
    weekViews,
    monthViews,
    dailyTrend,
    weeklyTrend,
    topPlaces,
    loading,
    fetchStats,
    fetchTrend,
    fetchTopPlaces,
  } = useViewStatsStore();

  const { total: totalFeedbacks, fetchList: fetchFeedbacks } = useFeedbackStore();
  const { total: totalUsers, fetchList: fetchUsers } = useUsersStore();
  const { total: totalAttractions, fetchList: fetchAttractions } = useAttractionsStore();

  const [trendType, setTrendType] = useState<'daily' | 'weekly'>('daily');
  const [trendDays, setTrendDays] = useState(7);

  useEffect(() => {
    // 并行获取所有数据
    Promise.all([
      fetchStats(),
      fetchTrend('daily', 7),
      fetchTopPlaces(10),
      fetchFeedbacks({ page: 1, pageSize: 1 }),
      fetchUsers({ page: 1, pageSize: 1 }),
      fetchAttractions({ page: 1, pageSize: 1, keyword: '', category: 'all', location: 'all' }),
    ]);
  }, []);

  // 切换趋势类型
  useEffect(() => {
    fetchTrend(trendType, trendType === 'daily' ? trendDays : 8);
  }, [trendType, trendDays]);

  const statCards = [
    {
      title: '总浏览量',
      value: totalViews.toLocaleString(),
      subValue: `今日 ${todayViews.toLocaleString()}`,
      icon: <EyeOutlined />,
      color: 'var(--primary-500)',
    },
    {
      title: '本周浏览',
      value: weekViews.toLocaleString(),
      subValue: '近7天累计',
      icon: <CalendarOutlined />,
      color: 'var(--success-500)',
    },
    {
      title: '本月浏览',
      value: monthViews.toLocaleString(),
      subValue: '近30天累计',
      icon: <CalendarOutlined />,
      color: 'var(--warning-500)',
    },
    {
      title: '用户/景点/反馈',
      value: `${totalUsers}/${totalAttractions}/${totalFeedbacks}`,
      subValue: '累计数据',
      icon: <UserOutlined />,
      color: 'var(--info-500)',
    },
  ];

  const trendData = trendType === 'daily' ? dailyTrend : weeklyTrend;

  const topColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: '景点名称',
      dataIndex: 'placeName',
      key: 'placeName',
    },
    {
      title: '浏览量',
      dataIndex: 'totalCount',
      key: 'totalCount',
      render: (value: number) => value.toLocaleString(),
    },
  ];

  return (
    <div className={styles.dashboard}>
      <div className="page-header">
        <h1 className="page-title">数据概览</h1>
        <p className="page-subtitle">实时运营数据监控</p>
      </div>

      <Spin spinning={loading}>
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
                  <p className={styles.statSubValue}>{stat.subValue}</p>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 趋势图表 */}
        <Card
          className={styles.chartCard}
          title="浏览趋势"
          extra={
            <Space>
              <Segmented
                value={trendType}
                onChange={(value) => setTrendType(value as 'daily' | 'weekly')}
                options={[
                  { label: '按日', value: 'daily' },
                  { label: '按周', value: 'weekly' },
                ]}
              />
              {trendType === 'daily' && (
                <Segmented
                  value={trendDays}
                  onChange={(value) => setTrendDays(value as number)}
                  options={[
                    { label: '7天', value: 7 },
                    { label: '14天', value: 14 },
                    { label: '30天', value: 30 },
                  ]}
                />
              )}
            </Space>
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            {trendType === 'daily' ? (
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                <XAxis dataKey="date" stroke="var(--gray-500)" />
                <YAxis stroke="var(--gray-500)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid var(--gray-200)',
                    borderRadius: 'var(--radius-md)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="浏览量"
                  stroke="var(--primary-500)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--primary-500)', r: 3 }}
                />
              </LineChart>
            ) : (
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                <XAxis dataKey="date" stroke="var(--gray-500)" />
                <YAxis stroke="var(--gray-500)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid var(--gray-200)',
                    borderRadius: 'var(--radius-md)',
                  }}
                />
                <Legend />
                <Bar dataKey="count" name="周浏览量" fill="var(--primary-500)" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </Card>

        {/* 热门景点排行 */}
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Card className={styles.rankCard} title="热门景点排行（近30天）">
              <Table
                dataSource={topPlaces}
                columns={topColumns}
                pagination={false}
                size="small"
                rowKey="placeId"
                locale={{ emptyText: '暂无数据' }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card className={styles.rankCard} title="浏览量统计">
              <div className={styles.progressList}>
                <div className={styles.progressItem}>
                  <div className={styles.progressLabel}>
                    <span>今日浏览</span>
                    <span>{todayViews.toLocaleString()}</span>
                  </div>
                  <Progress
                    percent={Math.min((todayViews / 100) * 100, 100)}
                    showInfo={false}
                    strokeColor="var(--primary-500)"
                  />
                </div>
                <div className={styles.progressItem}>
                  <div className={styles.progressLabel}>
                    <span>本周浏览</span>
                    <span>{weekViews.toLocaleString()}</span>
                  </div>
                  <Progress
                    percent={Math.min((weekViews / 500) * 100, 100)}
                    showInfo={false}
                    strokeColor="var(--success-500)"
                  />
                </div>
                <div className={styles.progressItem}>
                  <div className={styles.progressLabel}>
                    <span>本月浏览</span>
                    <span>{monthViews.toLocaleString()}</span>
                  </div>
                  <Progress
                    percent={Math.min((monthViews / 2000) * 100, 100)}
                    showInfo={false}
                    strokeColor="var(--warning-500)"
                  />
                </div>
                <div className={styles.progressItem}>
                  <div className={styles.progressLabel}>
                    <span>总浏览量</span>
                    <span>{totalViews.toLocaleString()}</span>
                  </div>
                  <Progress
                    percent={Math.min((totalViews / 10000) * 100, 100)}
                    showInfo={false}
                    strokeColor="var(--info-500)"
                  />
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

// Space 组件
const Space: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', gap: '12px' }}>{children}</div>
);

export default Dashboard;
