import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Space, Badge } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  ToolOutlined,
  AuditOutlined,
  BarChartOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined,
  TagsOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: '/assets',
    icon: <AppstoreOutlined />,
    label: 'Assets',
  },
  {
    key: '/bookings',
    icon: <CalendarOutlined />,
    label: 'Bookings',
  },
  {
    key: '/maintenance',
    icon: <ToolOutlined />,
    label: 'Maintenance',
  },
  {
    key: '/audits',
    icon: <AuditOutlined />,
    label: 'Audits',
  },
  {
    key: 'org',
    icon: <BankOutlined />,
    label: 'Organization',
    children: [
      { key: '/org/departments', icon: <TeamOutlined />, label: 'Departments' },
      { key: '/org/categories', icon: <TagsOutlined />, label: 'Categories' },
      { key: '/org/facilities', icon: <BankOutlined />, label: 'Facilities' },
    ],
  },
  {
    key: '/reports',
    icon: <BarChartOutlined />,
    label: 'Reports',
  },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: `${user?.name} (${user?.role})`,
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: () => logout(),
    },
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'var(--danger)';
      case 'MANAGER': return 'var(--warning)';
      default: return 'var(--primary)';
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={260}
        theme="dark"
        style={{
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        {/* Brand */}
        <div className="sidebar-brand" style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <div className="sidebar-brand-icon">AF</div>
          {!collapsed && <span className="sidebar-brand-text">AssetFlow</span>}
        </div>

        {/* Navigation */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={location.pathname.startsWith('/org') ? ['org'] : []}
          items={menuItems}
          onClick={({ key }) => {
            if (key && key !== 'org') {
              navigate(key);
            }
          }}
          style={{ borderRight: 'none' }}
        />
      </Sider>

      {/* Main Area */}
      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'margin-left 0.2s' }}>
        {/* Header */}
        <Header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 16,
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 24px',
          height: 56,
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          {/* Notifications */}
          <Badge count={3} size="small" color="var(--primary)">
            <BellOutlined
              style={{ fontSize: 18, color: 'var(--text-secondary)', cursor: 'pointer' }}
              onClick={() => navigate('/notifications')}
            />
          </Badge>

          {/* User Menu */}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                size={32}
                style={{
                  background: `linear-gradient(135deg, ${getRoleColor(user?.role || '')} 0%, var(--bg-hover) 100%)`,
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <div style={{ lineHeight: 1.2 }}>
                <Text style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, display: 'block' }}>
                  {user?.name}
                </Text>
                <Text style={{
                  color: getRoleColor(user?.role || ''),
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  {user?.role}
                </Text>
              </div>
            </Space>
          </Dropdown>
        </Header>

        {/* Content */}
        <Content style={{
          padding: 24,
          background: 'var(--bg-base)',
          minHeight: 'calc(100vh - 56px)',
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
