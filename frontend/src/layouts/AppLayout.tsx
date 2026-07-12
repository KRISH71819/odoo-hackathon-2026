import React, { useState } from 'react';
import logo from '../assets/logo.png';
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

const allMenuItems = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
    roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
  },
  {
    key: '/assets',
    icon: <AppstoreOutlined />,
    label: 'Assets',
    roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
  },
  {
    key: '/bookings',
    icon: <CalendarOutlined />,
    label: 'Bookings',
    roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
  },
  {
    key: '/maintenance',
    icon: <ToolOutlined />,
    label: 'Maintenance',
    roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
  },
  {
    key: '/audits',
    icon: <AuditOutlined />,
    label: 'Audits',
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    key: 'org',
    icon: <BankOutlined />,
    label: 'Organization',
    roles: ['ADMIN', 'MANAGER'],
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
    roles: ['ADMIN', 'MANAGER'],
  },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [openKeys, setOpenKeys] = useState<string[]>(location.pathname.startsWith('/org') ? ['org'] : []);

  React.useEffect(() => {
    if (location.pathname.startsWith('/org')) {
      setOpenKeys(['org']);
    }
  }, [location.pathname]);

  // Filter menu items by user role
  const menuItems = allMenuItems
    .filter((item) => !item.roles || item.roles.includes(user?.role || 'EMPLOYEE'))
    .map(({ roles: _roles, ...item }) => item);

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
        width={240}
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
          <img src={logo} alt="AssetFlow" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
          {!collapsed && <span className="sidebar-brand-text">AssetFlow</span>}
        </div>

        {/* Navigation */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys)}
          items={menuItems}
          onClick={({ key }) => {
            if (key && key !== 'org') {
              navigate(key);
            }
          }}
          style={{ borderRight: 'none', marginTop: 8 }}
        />
      </Sider>

      {/* Main Area */}
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
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
