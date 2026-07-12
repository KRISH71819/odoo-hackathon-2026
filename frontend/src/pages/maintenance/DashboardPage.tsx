import React, { useState } from 'react';
import { Alert, Button, Card, Col, Empty, List, Row, Skeleton, Space, Statistic, Typography } from 'antd';
import {
  AppstoreOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { type BookingHeatmapCell, useDashboardOverview, useRecentActivity, useReportData } from '../../hooks/useMaintenance';
import BookingHeatmap from './BookingHeatmap';
import AssetRegistrationForm from '../assets/AssetRegistrationForm';

const { Title, Text } = Typography;

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [registerOpen, setRegisterOpen] = useState(false);
  const overview = useDashboardOverview();
  const activity = useRecentActivity(10);
  const heatmap = useReportData<BookingHeatmapCell[]>('booking-heatmap');
  const data = overview.data;

  const cards = [
    { title: 'Available', value: data?.assetsAvailable, color: '#22c55e', icon: <AppstoreOutlined /> },
    { title: 'Allocated', value: data?.assetsAllocated, color: '#06b6d4', icon: <ToolOutlined /> },
    { title: 'Active Bookings', value: data?.activeBookings, color: '#8b5cf6', icon: <CalendarOutlined /> },
    { title: 'Pending Returns', value: data?.pendingReturns, color: '#f97316', icon: <ClockCircleOutlined /> },
  ];

  return (
    <div style={{ animation: 'slideUpFade 0.4s ease-out' }}>
      <div style={{ marginBottom: 28 }}>
        <Title level={2} style={{ margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
          Dashboard
        </Title>
        <Text type="secondary">Today&apos;s overview</Text>
      </div>

      <Row gutter={[16, 16]}>
        {cards.map((card) => (
          <Col key={card.title} xs={24} sm={12} lg={6}>
            <Card
              styles={{ body: { padding: 20 } }}
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default',
              }}
              hoverable
            >
              {overview.isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Statistic
                    title={card.title}
                    value={card.value ?? 0}
                    valueStyle={{ color: card.color, fontWeight: 700, fontSize: 28 }}
                  />
                  <div style={{
                    color: card.color,
                    fontSize: 20,
                    background: `${card.color}18`,
                    borderRadius: 8,
                    padding: '8px 10px',
                  }}>
                    {card.icon}
                  </div>
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {data && data.assetsOverdueForReturn > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 16, borderRadius: 10 }}
          message={`${data.assetsOverdueForReturn} asset${data.assetsOverdueForReturn === 1 ? '' : 's'} overdue for return — flagged for follow-up`}
        />
      )}

      <Card style={{ marginTop: 16, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
        <Text style={{ display: 'block', marginBottom: 12, fontWeight: 600, color: 'var(--text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Quick Actions
        </Text>
        <Space size={[12, 12]} wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setRegisterOpen(true)}
            style={{ background: '#22c55e', borderColor: '#22c55e', fontWeight: 600 }}
          >
            Register Asset
          </Button>
          <Button
            type="primary"
            icon={<CalendarOutlined />}
            onClick={() => navigate('/bookings')}
            style={{ fontWeight: 600 }}
          >
            Book Resource
          </Button>
          <Button
            icon={<ToolOutlined />}
            onClick={() => navigate('/maintenance')}
            style={{ color: '#d97706', borderColor: '#d97706', fontWeight: 600 }}
          >
            Raise Maintenance
          </Button>
        </Space>
      </Card>

      <Card title="Recent Activity" style={{ marginTop: 16, borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
        {activity.isLoading ? <Skeleton active paragraph={{ rows: 5 }} /> : activity.isError ? (
          <Empty description="Could not load recent activity"><Button onClick={() => activity.refetch()}>Retry</Button></Empty>
        ) : (
          <List
            dataSource={activity.data ?? []}
            locale={{ emptyText: 'No activity recorded yet. Create assets or bookings to see activity here.' }}
            renderItem={(item) => (
              <List.Item extra={<Text type="secondary" style={{ fontSize: 12 }}>{formatTime(item.createdAt)}</Text>}>
                <List.Item.Meta
                  avatar={<ClockCircleOutlined style={{ color: 'var(--primary)', fontSize: 16 }} />}
                  title={item.displayText}
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Card
        title="Resource Booking Heatmap"
        style={{ marginTop: 16, borderRadius: 12, border: '1px solid var(--border-subtle)' }}
      >
        <BookingHeatmap data={heatmap.data} loading={heatmap.isLoading} compact />
      </Card>

      {/* Register Asset Drawer — opened directly from dashboard */}
      <AssetRegistrationForm open={registerOpen} onClose={() => setRegisterOpen(false)} />
    </div>
  );
}
