import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Spin, Segmented } from 'antd';
import {
  EyeOutlined,
  UserOutlined,
  CalendarOutlined,
  LoginOutlined,
  TeamOutlined,
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
import { useUserStatsStore } from '@/stores/userStats';
import { useFeedbackStore } from '@/stores/feedback';
import { useAttractionsStore } from '@/stores/attractions';
import styles from './index.module.scss';

const Dashboard: React.FC = () => {
  // 浏览量统计
  const {
    totalViews,
    todayViews,
    weekViews,
    monthViews,
    dailyTrend,
    weeklyTrend,
    topPlaces,
    loading: viewLoading,
    fetchStats: fetchViewStats,
    fetchTrend: fetchViewTrend,
    fetchTopPlaces,
  } = useViewStatsStore();

  // 用户统计
  const {
    todayFunnel,
    loginRate,
    registerRate,
    overallRate,
    todayActiveUsers,
    weekActiveUsers,
    monthActiveUsers,
    activeTrend,
    registerTrend,
    loading: userLoading,
    fetchStats: fetchUserStats,
    fetchTrend: fetchUserTrend,
  } = useUserStatsStore();

  // 其他统计
  const { total: totalFeedbacks, fetchList: fetchFeedbacks } = useFeedbackStore();
  const { total: totalAttractions, fetchList: fetchAttractions } = useAttractionsStore();

  const [viewTrendType, setViewTrendType] = useState<'daily' | 'weekly'>('daily');
  const [viewTrendDays, setViewTrendDays] = useState(7);
  const [userTrendDays, setUserTrendDays] = useState(7);

  useEffect(() => {
    // 并行获取所有数据
    Promise.all([
      fetchViewStats(),
      fetchViewTrend('daily', 7),
      fetchTopPlaces(10),
      fetchUserStats(),
      fetchUserTrend(7),
      fetchFeedbacks({ page: 1, pageSize: 1 }),
      fetchAttractions({ page: 1, pageSize: 1, keyword: '', category: 'all', location: 'all' }),
    ]);
  }, []);

  // 切换浏览趋势类型
  useEffect(() => {
    fetchViewTrend(viewTrendType, viewTrendType === 'daily' ? viewTrendDays : 8);
  }, [viewTrendType, viewTrendDays]);

  // 切换用户趋势天数
  useEffect(() => {
    fetchUserTrend(userTrendDays);
  }, [userTrendDays]);

  const loading = viewLoading || userLoading;

  // 浏览量统计卡片
  const viewStatCards = [
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
      title: '景点总数',
      value: totalAttractions.toLocaleString(),
      subValue: `反馈 ${totalFeedbacks}`,
      icon: <TeamOutlined />,
      color: 'var(--info-500)',
    },
  ];

  // 用户统计卡片
  const userStatCards = [
    {
      title: '今日日活',
      value: todayActiveUsers.toLocaleString(),
      subValue: 'DAU',
      icon: <UserOutlined />,
      color: 'var(--primary-500)',
    },
    {
      title: '本周日活',
      value: weekActiveUsers.toLocaleString(),
      subValue: '近7天累计',
      icon: <TeamOutlined />,
      color: 'var(--success-500)',
    },
    {
      title: '本月日活',
      value: monthActiveUsers.toLocaleString(),
      subValue: '近30天累计',
      icon: <TeamOutlined />,
      color: 'var(--warning-500)',
    },
    {
      title: '注册转化率',
      value: `${overallRate}%`,
      subValue: `登录 ${loginRate}% | 注册 ${registerRate}%`,
      icon: <LoginOutlined />,
      color: overallRate >= 30 ? 'var(--success-500)' : overallRate >= 15 ? 'var(--warning-500)' : 'var(--error-500)',
    },
  ];

  const viewTrendData = viewTrendType === 'daily' ? dailyTrend : weeklyTrend;

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

  // 转化漏斗数据
  const funnelData = [
    { name: '访问登录页', value: todayFunnel.loginPageVisit, color: '#1890ff' },
    { name: '登录成功', value: todayFunnel.loginSuccess, color: '#52c41a' },
    { name: '访问注册页', value: todayFunnel.registerPageVisit, color: '#faad14' },
    { name: '注册成功', value: todayFunnel.registerSuccess, color: '#eb2f96' },
  ];

  return (
    <div className={styles.dashboard}>
      <div className="page-header">
        <h1 className="page-title">数据概览</h1>
        <p className="page-subtitle">实时运营数据监控</p>
      </div>

      <Spin spinning={loading}>
        {/* 浏览量统计卡片 */}
        <Row gutter={16} className={styles.statCards}>
          {viewStatCards.map((stat, index) => (
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

        {/* 用户统计卡片 */}
        <Row gutter={16} className={styles.statCards}>
          {userStatCards.map((stat, index) => (
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

        {/* 图表区域 */}
        <Row gutter={16}>
          {/* 浏览趋势 */}
          <Col xs={24} lg={12}>
            <Card
              className={styles.chartCard}
              title="浏览趋势"
              extra={
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Segmented
                    size="small"
                    value={viewTrendType}
                    onChange={(value) => setViewTrendType(value as 'daily' | 'weekly')}
                    options={[
                      { label: '按日', value: 'daily' },
                      { label: '按周', value: 'weekly' },
                    ]}
                  />
                  {viewTrendType === 'daily' && (
                    <Segmented
                      size="small"
                      value={viewTrendDays}
                      onChange={(value) => setViewTrendDays(value as number)}
                      options={[
                        { label: '7天', value: 7 },
                        { label: '14天', value: 14 },
                        { label: '30天', value: 30 },
                      ]}
                    />
                  )}
                </div>
              }
            >
              <ResponsiveContainer width="100%" height={250}>
                {viewTrendType === 'daily' ? (
                  <LineChart data={viewTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                    <XAxis dataKey="date" stroke="var(--gray-500)" fontSize={12} />
                    <YAxis stroke="var(--gray-500)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid var(--gray-200)',
                        borderRadius: 8,
                      }}
                    />
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
                  <BarChart data={viewTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                    <XAxis dataKey="date" stroke="var(--gray-500)" fontSize={12} />
                    <YAxis stroke="var(--gray-500)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid var(--gray-200)',
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="count" name="周浏览量" fill="var(--primary-500)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* 日活趋势 */}
          <Col xs={24} lg={12}>
            <Card
              className={styles.chartCard}
              title="日活 & 新增用户趋势"
              extra={
                <Segmented
                  size="small"
                  value={userTrendDays}
                  onChange={(value) => setUserTrendDays(value as number)}
                  options={[
                    { label: '7天', value: 7 },
                    { label: '14天', value: 14 },
                    { label: '30天', value: 30 },
                  ]}
                />
              }
            >
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={activeTrend.map((item, index) => ({
                  date: item.date,
                  activeUser: item.count,
                  newUser: registerTrend[index]?.count || 0,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                  <XAxis dataKey="date" stroke="var(--gray-500)" fontSize={12} />
                  <YAxis stroke="var(--gray-500)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid var(--gray-200)',
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="activeUser"
                    name="日活用户"
                    stroke="var(--primary-500)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--primary-500)', r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="newUser"
                    name="新增用户"
                    stroke="var(--success-500)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--success-500)', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        {/* 转化漏斗 & 热门景点 */}
        <Row gutter={16}>
          {/* 用户转化漏斗 */}
          <Col xs={24} lg={12}>
            <Card className={styles.rankCard} title="今日用户转化漏斗">
              <div className={styles.funnel}>
                {funnelData.map((item, index) => {
                  const maxValue = funnelData[0].value || 1;
                  const width = Math.max((item.value / maxValue) * 100, 10);
                  const prevValue = index > 0 ? funnelData[index - 1].value : item.value;
                  const rate = index > 0 && prevValue > 0
                    ? Math.round((item.value / prevValue) * 100)
                    : 100;

                  return (
                    <div key={item.name} className={styles.funnelItem}>
                      <div className={styles.funnelLabel}>
                        <span>{item.name}</span>
                        <span>
                          {item.value.toLocaleString()}
                          {index > 0 && <span className={styles.funnelRate}> ({rate}%)</span>}
                        </span>
                      </div>
                      <div className={styles.funnelBar}>
                        <div
                          className={styles.funnelBarInner}
                          style={{
                            width: `${width}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.funnelSummary}>
                <div className={styles.funnelSummaryItem}>
                  <span>登录转化率</span>
                  <span className={styles.funnelSummaryValue}>{loginRate}%</span>
                </div>
                <div className={styles.funnelSummaryItem}>
                  <span>注册转化率</span>
                  <span className={styles.funnelSummaryValue}>{registerRate}%</span>
                </div>
                <div className={styles.funnelSummaryItem}>
                  <span>整体转化率</span>
                  <span className={styles.funnelSummaryValue}>{overallRate}%</span>
                </div>
              </div>
            </Card>
          </Col>

          {/* 热门景点排行 */}
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
        </Row>
      </Spin>
    </div>
  );
};

export default Dashboard;
