import React, { useState } from 'react';
import { App as AntApp, Button, Card, Col, Empty, Row, Select, Skeleton, Space, Table, Tag, Typography } from 'antd';
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import client from '../../api/client';
import {
  type AssetDueForMaintenanceRow,
  type BookingHeatmapCell,
  type DepartmentAllocationRow,
  type IdleAssetRow,
  type MaintenanceFrequencyRow,
  type MostUsedAssetRow,
  type ReportType,
  type UtilizationByDepartmentRow,
  useReportData,
} from '../../hooks/useMaintenance';
import BookingHeatmap from './BookingHeatmap';

const { Title, Text } = Typography;

const reportOptions: Array<{ value: ReportType; label: string }> = [
  { value: 'utilization-by-department', label: 'Utilization by Department' },
  { value: 'maintenance-frequency', label: 'Maintenance Frequency' },
  { value: 'most-used-assets', label: 'Most Used Assets' },
  { value: 'idle-assets', label: 'Idle Assets' },
  { value: 'assets-due-for-maintenance', label: 'Assets Due for Maintenance' },
  { value: 'department-allocation-summary', label: 'Department Allocation Summary' },
  { value: 'booking-heatmap', label: 'Booking Heatmap' },
];

function formatDate(value: string | null | undefined) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : '—';
}

function ReportLoading({ loading, error, children }: { loading: boolean; error: boolean; children: React.ReactNode }) {
  if (loading) return <Skeleton active paragraph={{ rows: 5 }} />;
  if (error) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Report data could not be loaded" />;
  return <>{children}</>;
}

export default function ReportsPage() {
  const { message } = AntApp.useApp();
  const [reportType, setReportType] = useState<ReportType>('utilization-by-department');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [downloading, setDownloading] = useState(false);
  const utilization = useReportData<UtilizationByDepartmentRow[]>('utilization-by-department');
  const maintenance = useReportData<MaintenanceFrequencyRow[]>('maintenance-frequency');
  const mostUsed = useReportData<MostUsedAssetRow[]>('most-used-assets');
  const idle = useReportData<IdleAssetRow[]>('idle-assets');
  const due = useReportData<AssetDueForMaintenanceRow[]>('assets-due-for-maintenance');
  const allocation = useReportData<DepartmentAllocationRow[]>('department-allocation-summary');
  const heatmap = useReportData<BookingHeatmapCell[]>('booking-heatmap');

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const response = await client.get(`/reports/${reportType}/export`, { params: { format }, responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
      message.success(`${format.toUpperCase()} export created.`);
    } catch {
      message.error('Unable to export this report.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 20 }}>
        <div><Title level={2} style={{ margin: 0 }}>Reports</Title><Text type="secondary">Data-backed utilization, maintenance, and booking insights.</Text></div>
        <Space wrap>
          <Select value={reportType} onChange={(value) => setReportType(value as ReportType)} options={reportOptions} style={{ minWidth: 230 }} />
          <Select value={format} onChange={(value) => setFormat(value as 'csv' | 'json')} options={[{ value: 'csv', label: 'CSV' }, { value: 'json', label: 'JSON' }]} style={{ width: 90 }} />
          <Button type="primary" icon={<DownloadOutlined />} onClick={downloadReport} loading={downloading}>Export Report</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Utilization by Department">
            <ReportLoading loading={utilization.isLoading} error={utilization.isError}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={utilization.data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="department" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="allocatedCount" name="Allocated assets" fill="#1677ff" radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </ReportLoading>
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Maintenance Frequency">
            <ReportLoading loading={maintenance.isLoading} error={maintenance.isError}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={maintenance.data?.slice(0, 10)}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="assetTag" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="requestCount" name="Requests" fill="#f97316" radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </ReportLoading>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 0 }}>
        <Col xs={24} lg={12}>
          <Card title="Most Used Assets" style={{ marginTop: 16 }}>
            <ReportLoading loading={mostUsed.isLoading} error={mostUsed.isError}>
              <Table size="small" rowKey="assetTag" pagination={false} dataSource={mostUsed.data} columns={[
                { title: 'Asset', key: 'asset', render: (_, row: MostUsedAssetRow) => <><Text strong>{row.assetTag}</Text><div><Text type="secondary">{row.assetName}</Text></div></> },
                { title: 'Bookings', dataIndex: 'bookingCount', align: 'right' },
                { title: 'Hours', dataIndex: 'totalHours', align: 'right' },
              ]} />
            </ReportLoading>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Idle Assets" style={{ marginTop: 16 }}>
            <ReportLoading loading={idle.isLoading} error={idle.isError}>
              <Table size="small" rowKey="assetTag" pagination={false} dataSource={idle.data} columns={[
                { title: 'Asset', key: 'asset', render: (_, row: IdleAssetRow) => <><Text strong>{row.assetTag}</Text><div><Text type="secondary">{row.assetName}</Text></div></> },
                { title: 'Category', dataIndex: 'category' },
                { title: 'Idle', key: 'idleDays', render: (_, row: IdleAssetRow) => `${row.idleDays} days` },
              ]} />
            </ReportLoading>
          </Card>
        </Col>
      </Row>

      <Card title="Assets Due for Maintenance / Nearing Retirement" style={{ marginTop: 16 }}>
        <ReportLoading loading={due.isLoading} error={due.isError}>
          <Table size="small" rowKey={(row: AssetDueForMaintenanceRow) => `${row.assetTag}-${row.reason}`} pagination={{ pageSize: 6 }} dataSource={due.data} columns={[
            { title: 'Asset', key: 'asset', render: (_, row: AssetDueForMaintenanceRow) => <><Text strong>{row.assetTag}</Text><div><Text type="secondary">{row.assetName}</Text></div></> },
            { title: 'Reason', dataIndex: 'reason' },
            { title: 'Due date', key: 'dueDate', render: (_, row: AssetDueForMaintenanceRow) => formatDate(row.dueDate) },
          ]} />
        </ReportLoading>
      </Card>

      <Card title="Department-wise Allocation Summary" style={{ marginTop: 16 }}>
        <ReportLoading loading={allocation.isLoading} error={allocation.isError}>
          <Table size="small" rowKey="department" pagination={false} dataSource={allocation.data} columns={[
            { title: 'Department', dataIndex: 'department', render: (value: string) => <Text strong>{value}</Text> },
            { title: 'Categories', key: 'categories', render: (_, row: DepartmentAllocationRow) => <Space size={[4, 4]} wrap>{row.categories.length ? row.categories.map((category) => <Tag key={category.name}>{category.name}: {category.count}</Tag>) : '—'}</Space> },
            { title: 'Total Assets', dataIndex: 'totalAssets', align: 'right' },
          ]} />
        </ReportLoading>
      </Card>

      <Card title={<Space><FileTextOutlined />Booking Heatmap</Space>} style={{ marginTop: 16 }}>
        <BookingHeatmap data={heatmap.data} loading={heatmap.isLoading} />
      </Card>
    </div>
  );
}
