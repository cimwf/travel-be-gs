import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Avatar, Dropdown, Breadcrumb } from 'antd';
import {
  DashboardOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  ShoppingCartOutlined,
  MessageOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PictureOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/auth';
import styles from './MainLayout.module.scss';

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '数据概览' },
  { key: '/attractions', icon: <EnvironmentOutlined />, label: '景点管理' },
  { key: '/images', icon: <PictureOutlined />, label: '图片资源' },
  { key: '/banners', icon: <AppstoreOutlined />, label: 'Banner 管理' },
  { key: '/hotels', icon: <HomeOutlined />, label: '酒店管理' },
  { key: '/orders', icon: <ShoppingCartOutlined />, label: '订单管理' },
  { key: '/feedback', icon: <MessageOutlined />, label: '用户反馈' },
  { key: '/users', icon: <UserOutlined />, label: '用户管理' },
  { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
];

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'profile', label: '个人设置' },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      handleLogout();
    }
  };

  // 获取面包屑
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const nameMap: Record<string, string> = {
      dashboard: '数据概览',
      attractions: '景点管理',
      images: '图片资源',
      banners: 'Banner 管理',
      hotels: '酒店管理',
      orders: '订单管理',
      feedback: '用户反馈',
      users: '用户管理',
      settings: '系统设置',
      edit: '编辑',
      create: '新增',
    };

    const items: { title: string; href?: string }[] = [{ title: '首页', href: '/dashboard' }];
    paths.forEach((path, index) => {
      const name = nameMap[path] || path;
      if (index === paths.length - 1) {
        items.push({ title: name });
      } else {
        items.push({ title: name, href: `/${paths.slice(0, index + 1).join('/')}` });
      }
    });

    return items;
  };

  return (
    <div className={styles.layout}>
      {/* 侧边栏 */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🏔️</span>
          {!collapsed && <span className={styles.logoText}>北京旅行</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname.split('/').slice(0, 2).join('/') || '/dashboard']}
          items={menuItems}
          onClick={handleMenuClick}
          inlineCollapsed={collapsed}
        />
      </aside>

      {/* 主内容区 */}
      <div className={styles.main}>
        {/* 头部 */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div
              className={styles.collapseBtn}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
            <Breadcrumb items={getBreadcrumbs()} />
          </div>
          <div className={styles.headerRight}>
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
            >
              <div className={styles.userInfo}>
                <Avatar
                  size={32}
                  style={{ backgroundColor: 'var(--primary-100)', color: 'var(--primary-600)' }}
                >
                  {user?.nickname?.charAt(0) || '管'}
                </Avatar>
                <span className={styles.userName}>{user?.nickname || '管理员'}</span>
              </div>
            </Dropdown>
          </div>
        </header>

        {/* 内容区 */}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
