import React, { useState } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Card,
  Row,
  Col,
  Space,
  Typography,
  message,
} from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAssets, useCategories, useUpdateAsset } from '../../hooks/useAssets';
import AssetRegistrationForm from './AssetRegistrationForm';
import type { ColumnsType } from 'antd/es/table';
import { useAuth } from '../../context/AuthContext';

const { Title } = Typography;

// Custom status badge — dark-mode safe, no Ant Design color token leaking
const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  AVAILABLE:         { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e', border: 'rgba(34,197,94,0.35)' },
  ALLOCATED:         { bg: 'rgba(6,182,212,0.12)',   color: '#06b6d4', border: 'rgba(6,182,212,0.35)' },
  RESERVED:          { bg: 'rgba(249,115,22,0.12)',  color: '#f97316', border: 'rgba(249,115,22,0.35)' },
  UNDER_MAINTENANCE: { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', border: 'rgba(239,68,68,0.35)' },
  RETIRED:           { bg: 'rgba(113,113,122,0.12)', color: '#71717a', border: 'rgba(113,113,122,0.35)' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE['RETIRED'];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.04em',
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

const STATUS_OPTIONS = [
  { label: 'Available', value: 'AVAILABLE' },
  { label: 'Allocated', value: 'ALLOCATED' },
  { label: 'Reserved', value: 'RESERVED' },
  { label: 'Under Maintenance', value: 'UNDER_MAINTENANCE' },
  { label: 'Retired', value: 'RETIRED' },
];

export default function AssetDirectoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{
    status?: string;
    categoryId?: string;
    page: number;
    limit: number;
  }>({ page: 1, limit: 10 });

  const { data, isLoading, refetch } = useAssets({ ...filters, search: search || undefined });
  const { data: categories } = useCategories();
  const updateAsset = useUpdateAsset();

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateAsset.mutateAsync({ id, data: { status: newStatus } });
      message.success('Asset status updated');
    } catch {
      message.error('Failed to update status');
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: 'Tag',
      dataIndex: 'tag',
      key: 'tag',
      width: 110,
      render: (tag: string, record: any) => (
        <a
          onClick={() => navigate(`/assets/${record.id}`)}
          style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace', fontSize: 13 }}
        >
          {tag}
        </a>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Category',
      dataIndex: ['category', 'name'],
      key: 'category',
      width: 140,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (status: string, record: any) =>
        isAdmin ? (
          <Select
            value={status}
            size="small"
            style={{ width: 170 }}
            onChange={(val) => handleStatusChange(record.id, val)}
            options={STATUS_OPTIONS}
            variant="borderless"
            labelRender={({ value }) => <StatusBadge status={String(value)} />}
          />
        ) : (
          <StatusBadge status={status} />
        ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      ellipsis: true,
      render: (loc: string) => loc || '—',
    },
  ];

  return (
    <div style={{ animation: 'slideUpFade 0.4s ease-out' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
            Assets
          </Title>
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {data?.total ?? 0} total assets
          </span>
        </div>
        {isAdmin && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setDrawerOpen(true)}
            style={{ background: '#22c55e', borderColor: '#22c55e', fontWeight: 600 }}
          >
            Register Asset
          </Button>
        )}
      </Row>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16, borderRadius: 10 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={10}>
            <Input
              placeholder="Search by tag, name, serial, or QR code..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setFilters((f) => ({ ...f, page: 1 }));
              }}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={5}>
            <Select
              placeholder="Category"
              allowClear
              style={{ width: '100%' }}
              onChange={(v) => setFilters((f) => ({ ...f, categoryId: v, page: 1 }))}
              options={(categories || []).map((c: any) => ({ label: c.name, value: c.id }))}
            />
          </Col>
          <Col xs={12} sm={6} md={5}>
            <Select
              placeholder="Status"
              allowClear
              style={{ width: '100%' }}
              onChange={(v) => setFilters((f) => ({ ...f, status: v, page: 1 }))}
              options={STATUS_OPTIONS}
            />
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card style={{ borderRadius: 10, padding: 0 }}>
        <Table
          columns={columns}
          dataSource={data?.data || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: data?.page || 1,
            pageSize: data?.limit || 10,
            total: data?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `${total} assets`,
            onChange: (page, pageSize) => setFilters((f) => ({ ...f, page, limit: pageSize })),
          }}
          locale={{ emptyText: 'No assets found. Register your first asset to get started.' }}
          scroll={{ x: 700 }}
          size="middle"
          style={{ borderRadius: 10 }}
        />
      </Card>

      {/* Registration Drawer */}
      <AssetRegistrationForm open={drawerOpen} onClose={() => { setDrawerOpen(false); refetch(); }} />
    </div>
  );
}
