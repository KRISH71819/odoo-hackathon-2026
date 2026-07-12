import React, { useState } from 'react';
import { App as AntApp, Avatar, Badge, Button, Empty, List, Segmented, Skeleton, Space, Typography } from 'antd';
import {
  AlertOutlined,
  BellOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { type AppNotification, type NotificationType, useMarkAllAsRead, useMarkAsRead, useNotifications } from '../../hooks/useMaintenance';

const { Title, Text } = Typography;

const notificationVisuals: Record<string, { color: string; icon: React.ReactNode }> = {
  ALERT: { color: '#ef4444', icon: <AlertOutlined /> },
  APPROVAL: { color: '#3b82f6', icon: <CheckCircleOutlined /> },
  BOOKING: { color: '#eab308', icon: <CalendarOutlined /> },
  MAINTENANCE: { color: '#22c55e', icon: <ToolOutlined /> },
  AUDIT: { color: '#64748b', icon: <BellOutlined /> },
};

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function NotificationsPage() {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const [type, setType] = useState<NotificationType>('ALL');
  const notifications = useNotifications({ type });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const openNotification = async (notification: AppNotification) => {
    try {
      if (!notification.isRead) await markAsRead.mutateAsync(notification.id);
      if (notification.link) navigate(notification.link);
    } catch {
      message.error('Unable to update this notification.');
    }
  };

  const markEverythingRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
      message.success('All notifications marked as read.');
    } catch {
      message.error('Unable to mark notifications as read.');
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <Space size={8}><Title level={2} style={{ margin: 0 }}>Notifications</Title><Badge count={notifications.data?.unreadCount ?? 0} /></Space>
          <div><Text type="secondary">Updates and actions that need your attention.</Text></div>
        </div>
        <Button onClick={markEverythingRead} loading={markAllAsRead.isPending} disabled={!notifications.data?.unreadCount}>Mark all as read</Button>
      </div>

      <Segmented
        value={type}
        onChange={(value) => setType(value as NotificationType)}
        options={[
          { label: 'All', value: 'ALL' },
          { label: 'Alerts', value: 'ALERT' },
          { label: 'Approvals', value: 'APPROVAL' },
          { label: 'Bookings', value: 'BOOKING' },
        ]}
        style={{ marginBottom: 16 }}
      />

      {notifications.isLoading ? <Skeleton active paragraph={{ rows: 8 }} /> : notifications.isError ? (
        <Empty description="Could not load notifications"><Button onClick={() => notifications.refetch()}>Retry</Button></Empty>
      ) : (
        <List
          bordered
          dataSource={notifications.data?.notifications ?? []}
          locale={{ emptyText: 'You are all caught up.' }}
          renderItem={(notification) => {
            const visual = notificationVisuals[notification.type] ?? notificationVisuals.ALERT;
            return (
              <List.Item
                onClick={() => openNotification(notification)}
                style={{ cursor: notification.link ? 'pointer' : 'default', background: notification.isRead ? undefined : 'rgba(22, 119, 255, 0.06)' }}
                extra={<Text type="secondary" style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{relativeTime(notification.createdAt)}</Text>}
              >
                <List.Item.Meta
                  avatar={<Badge dot={!notification.isRead} color="#1677ff"><Avatar style={{ background: visual.color }} icon={visual.icon} /></Badge>}
                  title={<Text strong={!notification.isRead}>{notification.title}</Text>}
                  description={notification.message}
                />
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );
}
