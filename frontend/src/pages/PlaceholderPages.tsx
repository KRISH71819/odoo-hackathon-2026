import React from 'react';
import { Typography, Space } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  ToolOutlined,
  AuditOutlined,
  BarChartOutlined,
  BellOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface PlaceholderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  member: string;
}

function PlaceholderPage({ icon, title, description, member }: PlaceholderProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      gap: 16,
    }}>
      <div style={{
        width: 72,
        height: 72,
        borderRadius: 'var(--radius-xl)',
        background: 'var(--primary-ghost)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
        color: 'var(--primary)',
      }}>
        {icon}
      </div>
      <Title level={3} style={{ fontFamily: 'var(--font-display)', marginBottom: 0 }}>{title}</Title>
      <Text style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>{description}</Text>
      <Text style={{
        fontSize: 11,
        color: 'var(--text-muted)',
        background: 'var(--bg-elevated)',
        padding: '4px 12px',
        borderRadius: 'var(--radius-pill)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontWeight: 500,
      }}>
        {member}
      </Text>
    </div>
  );
}

export const DashboardPage = () => (
  <PlaceholderPage
    icon={<DashboardOutlined />}
    title="Dashboard"
    description="Overview stats, quick actions, recent activity, and resource booking heatmap"
    member="Assigned to Member 4"
  />
);

export const AssetsPage = () => (
  <PlaceholderPage
    icon={<AppstoreOutlined />}
    title="Asset Management"
    description="Register, track, and manage all enterprise assets with lifecycle states"
    member="Assigned to Member 2"
  />
);

export const BookingsPage = () => (
  <PlaceholderPage
    icon={<CalendarOutlined />}
    title="Bookings"
    description="Book assets and facilities with real-time availability and status tracking"
    member="Assigned to Member 3"
  />
);

export const MaintenancePage = () => (
  <PlaceholderPage
    icon={<ToolOutlined />}
    title="Maintenance"
    description="Log and manage maintenance requests, track resolution progress"
    member="Assigned to Member 3"
  />
);

export const AuditsPage = () => (
  <PlaceholderPage
    icon={<AuditOutlined />}
    title="Audits"
    description="Conduct asset audits with verification tracking and discrepancy reporting"
    member="Assigned to Member 4"
  />
);

export const ReportsPage = () => (
  <PlaceholderPage
    icon={<BarChartOutlined />}
    title="Reports"
    description="Generate comprehensive reports: maintenance frequency, utilization, cost analysis"
    member="Assigned to Member 4"
  />
);

export const NotificationsPage = () => (
  <PlaceholderPage
    icon={<BellOutlined />}
    title="Notifications"
    description="System alerts, booking reminders, and maintenance updates"
    member="Assigned to Member 4"
  />
);
