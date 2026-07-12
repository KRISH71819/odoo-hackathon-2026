import React, { useState } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Card,
  Row,
  Col,
  Space,
  Typography,
} from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAssets, useCategories } from '../../hooks/useAssets';
import AssetRegistrationForm from './AssetRegistrationForm';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE: 'green',
  ALLOCATED: 'blue',
  RESERVED: 'orange',
  UNDER_MAINTENANCE: 'red',
  RETIRED: 'default',
};

const STATUS_OPTIONS = [
  { label: 'Available', value: 'AVAILABLE' },
  { label: 'Allocated', value: 'ALLOCATED' },
  { label: 'Reserved', value: 'RESERVED' },
  { label: 'Under Maintenance', value: 'UNDER_MAINTENANCE' },
  { label: 'Retired', value: 'RETIRED' },
];

export default function AssetDirectoryPage() {
  const navigate = useNavigate();
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

  const columns: ColumnsType<any> = [
    {
      title: 'Tag',
      dataIndex: 'tag',
      key: 'tag',
      width: 120,
      render: (tag: string, record: any) => (
        <a onClick={() => navigate(`/assets/${record.id}`)} style={{ fontWeight: 600 }}>
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
      width: 150,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: string) => (
        <Tag color={STATUS_COLOR[status] || 'default'}>
          {status.replace(/_/g, ' ')}
        </Tag>
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
    <div style={{ padding: 0 }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>
          Assets
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setDrawerOpen(true)}
          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
        >
          Register Asset
        </Button>
      </Row>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={10}>
            <Input
              placeholder="Search by tag, serial, or QR code..."
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
        locale={{ emptyText: 'No assets found' }}
        scroll={{ x: 700 }}
        size="middle"
      />

      {/* Registration Drawer */}
      <AssetRegistrationForm open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
