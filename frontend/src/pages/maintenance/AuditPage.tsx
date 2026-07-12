import React, { useMemo, useState } from 'react';
import { App as AntApp, Alert, Button, Card, Checkbox, DatePicker, Empty, Form, Input, Modal, Select, Skeleton, Space, Table, Tag, Typography } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, FileTextOutlined, PlusOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { useDepartments } from '../../hooks/useAssets';
import {
  type AuditItem,
  type AuditListItem,
  type AuditReport,
  useAudit,
  useAudits,
  useCreateAudit,
  useGenerateAuditReport,
  useUpdateAuditItem,
} from '../../hooks/useMaintenance';

const { Title, Text } = Typography;
const conditions = ['NEW', 'GOOD', 'FAIR', 'NEEDS_REPAIR', 'DECOMMISSIONED'];

function displayValue(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
}

function getItemStatus(item: AuditItem) {
  const conditionRank: Record<string, number> = { NEW: 0, GOOD: 1, FAIR: 2, NEEDS_REPAIR: 3, DECOMMISSIONED: 4 };
  if (item.actualCondition && item.expectedCondition && conditionRank[item.actualCondition] > conditionRank[item.expectedCondition]) {
    return { label: 'Damaged', color: 'red', icon: <WarningOutlined /> };
  }
  if (item.actualLocation !== null && item.actualLocation !== undefined && item.actualLocation !== item.expectedLocation) {
    return { label: 'Missing', color: 'orange', icon: <WarningOutlined /> };
  }
  if (item.isVerified) return { label: 'Verified', color: 'green', icon: <CheckCircleOutlined /> };
  return { label: 'Pending', color: 'default', icon: null };
}

function apiError(error: unknown) {
  const candidate = error as { response?: { data?: { error?: string } }; message?: string };
  return candidate.response?.data?.error || candidate.message || 'Unable to save your changes.';
}

export default function AuditPage() {
  const { message } = AntApp.useApp();
  const [selectedAuditId, setSelectedAuditId] = useState<string>();
  const [newAuditOpen, setNewAuditOpen] = useState(false);
  const [cycleOpen, setCycleOpen] = useState(false);
  const [report, setReport] = useState<AuditReport>();
  const [form] = Form.useForm();
  const audits = useAudits();
  const audit = useAudit(selectedAuditId);
  const departments = useDepartments();
  const createAudit = useCreateAudit();
  const updateItem = useUpdateAuditItem();
  const generateReport = useGenerateAuditReport();

  const listColumns: ColumnsType<AuditListItem> = useMemo(() => [
    { title: 'Title', dataIndex: 'title', render: (title: string) => <Text strong>{title}</Text> },
    { title: 'Department', key: 'department', render: (_, record) => record.department?.name ?? 'All assets' },
    { title: 'Scheduled date', dataIndex: 'scheduledDate', width: 150, render: formatDate },
    { title: 'Status', dataIndex: 'status', width: 140, render: (status: string) => <Tag color={status === 'COMPLETED' ? 'green' : status === 'IN_PROGRESS' ? 'blue' : 'gold'}>{displayValue(status)}</Tag> },
    { title: 'Items', dataIndex: 'itemCount', width: 90, align: 'center' },
  ], []);

  const saveItem = async (item: AuditItem, values: Record<string, unknown>) => {
    if (!selectedAuditId) return;
    try {
      await updateItem.mutateAsync({ auditId: selectedAuditId, itemId: item.id, ...values });
      message.success('Audit item updated.');
    } catch (error) {
      message.error(apiError(error));
    }
  };

  const createNewAudit = async () => {
    try {
      const values = await form.validateFields();
      const created = await createAudit.mutateAsync({
        ...values,
        departmentId: values.departmentId || null,
        scheduledDate: values.scheduledDate.toISOString(),
      });
      form.resetFields();
      setNewAuditOpen(false);
      setSelectedAuditId(created.id);
      message.success('Audit created and checklist populated.');
    } catch (error) {
      if ((error as { errorFields?: unknown }).errorFields) return;
      message.error(apiError(error));
    }
  };

  const runReport = async () => {
    if (!selectedAuditId) return;
    try {
      const result = await generateReport.mutateAsync(selectedAuditId);
      setReport(result);
      message.success('Audit report generated.');
    } catch (error) {
      message.error(apiError(error));
    }
  };

  if (selectedAuditId) {
    const detail = audit.data;
    const itemColumns: ColumnsType<AuditItem> = [
      {
        title: 'Asset', key: 'asset', width: 180,
        render: (_, item) => <div><Text strong>{item.asset.tag}</Text><div><Text type="secondary">{item.asset.name}</Text></div></div>,
      },
      { title: 'Expected location', dataIndex: 'expectedLocation', width: 160, render: (value) => value ?? '—' },
      {
        title: 'Actual location', key: 'actualLocation', width: 180,
        render: (_, item) => <Input key={`${item.id}-${item.actualLocation ?? ''}`} defaultValue={item.actualLocation ?? ''} placeholder="Not checked" onBlur={(event) => saveItem(item, { actualLocation: event.target.value.trim() || null })} />,
      },
      { title: 'Expected condition', dataIndex: 'expectedCondition', width: 160, render: (value) => value ? displayValue(value) : '—' },
      {
        title: 'Actual condition', key: 'actualCondition', width: 180,
        render: (_, item) => <Select value={item.actualCondition ?? undefined} placeholder="Not checked" style={{ width: '100%' }} options={conditions.map((value) => ({ value, label: displayValue(value) }))} onChange={(actualCondition) => saveItem(item, { actualCondition })} />,
      },
      {
        title: 'Verified', key: 'verified', width: 90, align: 'center',
        render: (_, item) => <Checkbox checked={item.isVerified} onChange={(event) => saveItem(item, { isVerified: event.target.checked })} aria-label={`Verify ${item.asset.tag}`} />,
      },
      {
        title: 'Status', key: 'status', width: 120,
        render: (_, item) => { const status = getItemStatus(item); return <Tag color={status.color} icon={status.icon}>{status.label}</Tag>; },
      },
    ];

    return (
      <div>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => setSelectedAuditId(undefined)}>All audits</Button>
          {audit.isLoading ? <Skeleton active paragraph={{ rows: 12 }} /> : audit.isError || !detail ? (
            <Empty description="Could not load this audit"><Button onClick={() => audit.refetch()}>Retry</Button></Empty>
          ) : <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <Title level={2} style={{ margin: 0 }}>{detail.title}</Title>
                <Text type="secondary">{detail.department?.name ?? 'All assets'} — {formatDate(detail.scheduledDate)}</Text>
              </div>
              <Space wrap>
                <Button icon={<FileTextOutlined />} onClick={() => setCycleOpen(true)}>Show Audit Cycle</Button>
                <Button type="primary" icon={<FileTextOutlined />} onClick={runReport} loading={generateReport.isPending}>Generate Report</Button>
              </Space>
            </div>
            <Card size="small">
              <Space size={24} wrap>
                <Text><strong>Assets:</strong> {detail.summary.totalItems}</Text>
                <Text><strong>Verified:</strong> {detail.summary.verifiedCount}</Text>
                <Text><strong>Flagged:</strong> {detail.summary.discrepancyCount}</Text>
              </Space>
            </Card>
            <Table columns={itemColumns} dataSource={detail.items} rowKey="id" pagination={false} scroll={{ x: 1150 }} loading={updateItem.isPending} />
            {detail.summary.discrepancyCount > 0 && <Alert type="error" showIcon message={`${detail.summary.discrepancyCount} asset${detail.summary.discrepancyCount === 1 ? '' : 's'} flagged — discrepancy report generated automatically.`} />}
          </>}
        </Space>

        <Modal title="Audit cycle" open={cycleOpen} onCancel={() => setCycleOpen(false)} footer={<Button onClick={() => setCycleOpen(false)}>Close</Button>}>
          <p>Schedule the audit, verify each asset against its expected location and condition, then generate the discrepancy report.</p>
        </Modal>
        <Modal title="Audit report" open={Boolean(report)} onCancel={() => setReport(undefined)} footer={<Button onClick={() => setReport(undefined)}>Close</Button>}>
          {report && <Space direction="vertical" style={{ width: '100%' }}>
            <Text><strong>{report.totalAssetsAudited}</strong> assets audited</Text>
            <Text><strong>{report.verifiedCount}</strong> verified ({report.verificationPercentage}%)</Text>
            <Text><strong>{report.discrepancyCount}</strong> discrepancies found</Text>
            {report.autoMarkedLostCount > 0 && (
              <Alert
                type="error"
                showIcon
                message={`${report.autoMarkedLostCount} asset${report.autoMarkedLostCount === 1 ? '' : 's'} auto-marked as LOST (unverified after audit close)`}
                description={report.lostAssets.map(a => a.asset.tag).join(', ')}
              />
            )}
            {report.discrepantAssets.map((asset) => <Text key={asset.auditItemId}>• {asset.asset.tag} — {asset.discrepancyNote || 'Details require review'}</Text>)}
          </Space>}
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div><Title level={2} style={{ margin: 0 }}>Asset Audit</Title><Text type="secondary">Verify asset locations and condition against the register.</Text></div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setNewAuditOpen(true)}>New Audit</Button>
      </div>
      {audits.isLoading ? <Skeleton active paragraph={{ rows: 10 }} /> : audits.isError ? <Empty description="Could not load audits"><Button onClick={() => audits.refetch()}>Retry</Button></Empty> : <Table columns={listColumns} dataSource={audits.data ?? []} rowKey="id" onRow={(record) => ({ onClick: () => setSelectedAuditId(record.id), style: { cursor: 'pointer' } })} locale={{ emptyText: 'No audits have been scheduled yet.' }} />}

      <Modal title="New Audit" open={newAuditOpen} onCancel={() => { form.resetFields(); setNewAuditOpen(false); }} onOk={createNewAudit} okText="Create Audit" confirmLoading={createAudit.isPending}>
        <Form form={form} layout="vertical" initialValues={{ scheduledDate: dayjs() }}>
          <Form.Item name="title" label="Audit title" rules={[{ required: true, min: 3, message: 'Enter an audit title.' }]}><Input placeholder="e.g. Q3 Audit: Engineering" /></Form.Item>
          <Form.Item name="departmentId" label="Department (optional)"><Select allowClear loading={departments.isLoading} placeholder="All assets" options={(departments.data ?? []).map((department: any) => ({ value: department.id, label: department.name }))} /></Form.Item>
          <Form.Item name="scheduledDate" label="Scheduled date" rules={[{ required: true, message: 'Choose a date.' }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={3} maxLength={2000} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
