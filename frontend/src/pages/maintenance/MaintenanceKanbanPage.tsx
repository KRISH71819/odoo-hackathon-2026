import React, { useMemo, useState } from 'react';
import {
  Alert,
  App as AntApp,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  ToolOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useAssets } from '../../hooks/useAssets';
import {
  type CreateMaintenancePayload,
  type MaintenanceRequest,
  type MaintenanceStatus,
  useCreateMaintenance,
  useMaintenanceAssignees,
  useMaintenanceRequests,
  useUpdateMaintenanceStatus,
} from '../../hooks/useMaintenance';

const { Title, Text, Paragraph } = Typography;

const columns: Array<{ status: MaintenanceStatus; label: string; color: string }> = [
  { status: 'PENDING', label: 'Pending', color: '#94a3b8' },
  { status: 'APPROVED', label: 'Approved', color: '#3b82f6' },
  { status: 'TECHNICIAN_ASSIGNED', label: 'Technician assigned', color: '#8b5cf6' },
  { status: 'IN_PROGRESS', label: 'In progress', color: '#f59e0b' },
  { status: 'RESOLVED', label: 'Resolved', color: '#22c55e' },
];

const nextStatus: Partial<Record<MaintenanceStatus, MaintenanceStatus>> = {
  PENDING: 'APPROVED',
  APPROVED: 'TECHNICIAN_ASSIGNED',
  TECHNICIAN_ASSIGNED: 'IN_PROGRESS',
  IN_PROGRESS: 'RESOLVED',
};

const priorityColor: Record<string, string> = {
  CRITICAL: 'red',
  HIGH: 'orange',
  MEDIUM: 'gold',
  LOW: 'green',
};

interface TransitionState {
  request: MaintenanceRequest;
  target: 'TECHNICIAN_ASSIGNED' | 'RESOLVED';
}

function apiError(error: unknown) {
  const candidate = error as { response?: { data?: { error?: string } }; message?: string };
  return candidate.response?.data?.error || candidate.message || 'Something went wrong. Please try again.';
}

function displayStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function MaintenanceKanbanPage() {
  const { message } = AntApp.useApp();
  const [createOpen, setCreateOpen] = useState(false);
  const [transition, setTransition] = useState<TransitionState | null>(null);
  const [createForm] = Form.useForm<CreateMaintenancePayload>();
  const [transitionForm] = Form.useForm<{ assignedToId?: string; resolutionNote?: string }>();
  const { data: requests = [], isLoading, isError, error, refetch } = useMaintenanceRequests();
  const { data: assetResult, isLoading: assetsLoading } = useAssets({ limit: 100 });
  const { data: users = [] } = useMaintenanceAssignees();
  const createMaintenance = useCreateMaintenance();
  const updateStatus = useUpdateMaintenanceStatus();

  const assets = assetResult?.data ?? [];
  const groupedRequests = useMemo(
    () => Object.fromEntries(columns.map((column) => [column.status, requests.filter((item) => item.status === column.status)])) as Record<MaintenanceStatus, MaintenanceRequest[]>,
    [requests]
  );

  const closeTransition = () => {
    transitionForm.resetFields();
    setTransition(null);
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      await createMaintenance.mutateAsync(values);
      message.success('Maintenance request created and asset marked under maintenance.');
      createForm.resetFields();
      setCreateOpen(false);
    } catch (error) {
      if ((error as { errorFields?: unknown }).errorFields) return;
      message.error(apiError(error));
    }
  };

  const advance = async (request: MaintenanceRequest) => {
    const target = nextStatus[request.status];
    if (!target) return;
    if (target === 'TECHNICIAN_ASSIGNED' || target === 'RESOLVED') {
      setTransition({ request, target });
      return;
    }

    try {
      await updateStatus.mutateAsync({ id: request.id, status: target });
      message.success(`Request moved to ${displayStatus(target)}.`);
    } catch (error) {
      message.error(apiError(error));
    }
  };

  const confirmTransition = async () => {
    if (!transition) return;
    try {
      const values = await transitionForm.validateFields();
      await updateStatus.mutateAsync({
        id: transition.request.id,
        status: transition.target,
        assignedToId: values.assignedToId,
        resolutionNote: values.resolutionNote,
      });
      message.success(
        transition.target === 'RESOLVED'
          ? 'Request resolved and asset returned to available.'
          : 'Technician assigned successfully.'
      );
      closeTransition();
    } catch (error) {
      if ((error as { errorFields?: unknown }).errorFields) return;
      message.error(apiError(error));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Maintenance board</Title>
          <Text type="secondary">Track every request from approval through repair and resolution.</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Raise maintenance request
        </Button>
      </div>

      <Alert
        showIcon
        type="info"
        style={{ marginBottom: 20 }}
        message="Maintenance workflow"
        description="Approving a request keeps its asset under maintenance. Resolving it returns the asset to available."
      />

      {isError ? (
        <Empty description={apiError(error)}>
          <Button onClick={() => refetch()}>Try again</Button>
        </Empty>
      ) : (
        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <Row gutter={16} wrap={false} style={{ minWidth: 1420 }}>
            {columns.map((column) => (
              <Col key={column.status} flex="0 0 280px">
                <div style={{ borderTop: `3px solid ${column.color}`, background: 'rgba(148, 163, 184, 0.07)', borderRadius: 12, padding: 12, minHeight: 500 }}>
                  <Space align="center" style={{ marginBottom: 12 }}>
                    <Text strong>{column.label}</Text>
                    <Tag style={{ margin: 0, borderRadius: 10 }}>{groupedRequests[column.status].length}</Tag>
                  </Space>
                  {isLoading ? (
                    <Space direction="vertical" style={{ width: '100%' }} size={12}>
                      <Skeleton active paragraph={{ rows: 4 }} />
                      <Skeleton active paragraph={{ rows: 3 }} />
                    </Space>
                  ) : groupedRequests[column.status].length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No requests" />
                  ) : (
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      {groupedRequests[column.status].map((request) => (
                        <MaintenanceCard key={request.id} request={request} onAdvance={() => advance(request)} busy={updateStatus.isPending} />
                      ))}
                    </Space>
                  )}
                </div>
              </Col>
            ))}
          </Row>
        </div>
      )}

      <Modal
        title="Raise maintenance request"
        open={createOpen}
        onCancel={() => { createForm.resetFields(); setCreateOpen(false); }}
        onOk={handleCreate}
        okText="Create request"
        confirmLoading={createMaintenance.isPending}
      >
        <Form form={createForm} layout="vertical" initialValues={{ type: 'CORRECTIVE', priority: 'MEDIUM' }}>
          <Form.Item name="assetId" label="Asset" rules={[{ required: true, message: 'Select the asset that needs maintenance.' }]}>
            <Select
              showSearch
              loading={assetsLoading}
              placeholder="Select an asset"
              optionFilterProp="label"
              options={assets.filter((asset: any) => asset.status !== 'RETIRED').map((asset: any) => ({ value: asset.id, label: `${asset.tag} — ${asset.name}` }))}
            />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                <Select options={['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY'].map((value) => ({ value, label: displayStatus(value) }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
                <Select options={['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((value) => ({ value, label: displayStatus(value) }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Issue description" rules={[{ required: true, min: 3, message: 'Describe the issue in at least 3 characters.' }]}>
            <Input.TextArea rows={4} maxLength={2000} showCount placeholder="Describe the issue, symptoms, or service needed" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={transition?.target === 'RESOLVED' ? 'Resolve maintenance request' : 'Assign technician'}
        open={!!transition}
        onCancel={closeTransition}
        onOk={confirmTransition}
        okText={transition?.target === 'RESOLVED' ? 'Resolve request' : 'Assign technician'}
        confirmLoading={updateStatus.isPending}
      >
        <Form form={transitionForm} layout="vertical">
          {transition?.target === 'TECHNICIAN_ASSIGNED' ? (
            <Form.Item name="assignedToId" label="Technician" rules={[{ required: true, message: 'Select a technician.' }]}>
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Select a team member"
                options={users.map((user) => ({ value: user.id, label: `${user.name}${user.role ? ` · ${user.role}` : ''}` }))}
              />
            </Form.Item>
          ) : (
            <Form.Item name="resolutionNote" label="Resolution note" rules={[{ required: true, min: 3, message: 'Add a brief resolution note.' }]}>
              <Input.TextArea rows={4} maxLength={2000} showCount placeholder="Describe the repair or completed work" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}

function MaintenanceCard({ request, onAdvance, busy }: { request: MaintenanceRequest; onAdvance: () => void; busy: boolean }) {
  const target = nextStatus[request.status];
  const actionLabel = target === 'TECHNICIAN_ASSIGNED'
    ? 'Assign technician'
    : target === 'RESOLVED'
      ? 'Resolve request'
      : target
        ? `Move to ${displayStatus(target)}`
        : '';

  return (
    <Card size="small" styles={{ body: { padding: 14 } }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <Tooltip title={request.asset.name}>
            <Text strong style={{ color: '#1677ff' }}>{request.asset.tag}</Text>
          </Tooltip>
          <Tag color={priorityColor[request.priority]} style={{ margin: 0 }}>{request.priority}</Tag>
        </div>
        <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, minHeight: 42 }}>{request.description}</Paragraph>
        <Text type="secondary" style={{ fontSize: 12 }}>Requested by {request.requestedBy.name}</Text>
        {request.assignedTo && <Text type="secondary" style={{ fontSize: 12 }}>Assigned to {request.assignedTo.name}</Text>}
        <Text type="secondary" style={{ fontSize: 11 }}>{formatDate(request.requestedAt)}</Text>
        {target && (
          <Button
            block
            size="small"
            type={target === 'RESOLVED' ? 'primary' : 'default'}
            loading={busy}
            icon={target === 'TECHNICIAN_ASSIGNED' ? <UserAddOutlined /> : target === 'RESOLVED' ? <CheckCircleOutlined /> : target === 'IN_PROGRESS' ? <ToolOutlined /> : <ArrowRightOutlined />}
            onClick={onAdvance}
          >
            {actionLabel}
          </Button>
        )}
      </Space>
    </Card>
  );
}
