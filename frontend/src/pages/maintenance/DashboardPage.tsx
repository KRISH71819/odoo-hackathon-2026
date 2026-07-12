import React from 'react';
import { Alert, Button, Card, Col, Empty, List, Row, Skeleton, Space, Statistic, Typography } from 'antd';
import {
  AppstoreOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDashboardOverview, useRecentActivity } from '../../hooks/useMaintenance';

const { Title, Text } = Typography;

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const overview = useDashboardOverview();
  const activity = useRecentActivity(10);
  const data = overview.data;

  const cards = [
    { title: 'Available', value: data?.assetsAvailable, color: '#22c55e', icon: <AppstoreOutlined /> },
    { title: 'Allocated', value: data?.assetsAllocated, color: '#3b82f6', icon: <ToolOutlined /> },
    { title: 'Active bookings', value: data?.activeBookings, color: '#8b5cf6', icon: <CalendarOutlined /> },
    { title: 'Pending returns', value: data?.pendingReturns, color: '#f97316', icon: <ClockCircleOutlined /> },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Dashboard</Title>
        <Text type="secondary">Today&apos;s overview</Text>
      </div>

      <Row gutter={[16, 16]}>
        {cards.map((card) => (
          <Col key={card.title} xs={24} sm={12} lg={6}>
            <Card styles={{ body: { padding: 20 } }}>
              {overview.isLoading ? <Skeleton active paragraph={{ rows: 1 }} /> : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Statistic title={card.title} value={card.value ?? 0} valueStyle={{ color: card.color, fontWeight: 700 }} />
                  <div style={{ color: card.color, fontSize: 22 }}>{card.icon}</div>
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
          style={{ marginTop: 16 }}
          message={`${data.assetsOverdueForReturn} asset${data.assetsOverdueForReturn === 1 ? '' : 's'} overdue for return — flagged for follow-up`}
        />
      )}

      <Card style={{ marginTop: 16 }}>
        <Space size={[12, 12]} wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/assets/register')} style={{ background: '#22a06b' }}>
            Register Asset
          </Button>
          <Button type="primary" icon={<CalendarOutlined />} onClick={() => navigate('/bookings')}>
            Book Resource
          </Button>
          <Button icon={<ToolOutlined />} onClick={() => navigate('/maintenance')} style={{ color: '#d97706', borderColor: '#d97706' }}>
            Raise Maintenance
          </Button>
        </Space>
      </Card>

      <Card title="Recent activity" style={{ marginTop: 16 }}>
        {activity.isLoading ? <Skeleton active paragraph={{ rows: 5 }} /> : activity.isError ? (
          <Empty description="Could not load recent activity"><Button onClick={() => activity.refetch()}>Retry</Button></Empty>
        ) : (
          <List
            dataSource={activity.data ?? []}
            locale={{ emptyText: 'No activity has been recorded yet.' }}
            renderItem={(item) => (
              <List.Item extra={<Text type="secondary" style={{ fontSize: 12 }}>{formatTime(item.createdAt)}</Text>}>
                <List.Item.Meta avatar={<ClockCircleOutlined style={{ color: '#1677ff' }} />} title={item.displayText} />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
