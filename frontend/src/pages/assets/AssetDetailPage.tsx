import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Timeline,
  Spin,
  Typography,
  Divider,
  Modal,
  Form,
  Select,
  Input,
  message,
  Result,
  Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined,
  SwapOutlined,
  RollbackOutlined,
  UserAddOutlined,
  QrcodeOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useAsset,
  useAllocateAsset,
  useTransferAsset,
  useReturnAsset,
  useApproveAllocation,
  useRejectAllocation,
  useDeleteAsset,
  useUsers,
  useDepartments,
} from '../../hooks/useAssets';

const { Title, Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE: 'green',
  ALLOCATED: 'blue',
  RESERVED: 'orange',
  UNDER_MAINTENANCE: 'red',
  RETIRED: 'default',
};

const ALLOC_STATUS_COLOR: Record<string, string> = {
  PENDING: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
};

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: asset, isLoading } = useAsset(id);
  const { data: users } = useUsers();
  const { data: departments } = useDepartments();

  const allocate = useAllocateAsset();
  const transfer = useTransferAsset();
  const returnAsset = useReturnAsset();
  const approve = useApproveAllocation();
  const reject = useRejectAllocation();
  const deleteAsset = useDeleteAsset();

  const [allocateOpen, setAllocateOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [allocateForm] = Form.useForm();
  const [transferForm] = Form.useForm();

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!asset) return <Result status="404" title="Asset not found" subTitle="The asset you're looking for doesn't exist." extra={<Button onClick={() => navigate('/assets')}>Back to Assets</Button>} />;

  const handleAllocate = async (values: any) => {
    try {
      await allocate.mutateAsync({ id: id!, data: values });
      message.success('Allocation request created');
      setAllocateOpen(false);
      allocateForm.resetFields();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Allocation failed');
    }
  };

  const handleTransfer = async (values: any) => {
    try {
      await transfer.mutateAsync({ id: id!, data: { newAllocatedToId: values.newAllocatedToId, reason: values.reason } });
      message.success('Transfer request submitted');
      setTransferOpen(false);
      transferForm.resetFields();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Transfer failed');
    }
  };

  const handleReturn = async () => {
    try {
      await returnAsset.mutateAsync({ id: id!, data: {} });
      message.success('Asset returned successfully');
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Return failed');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAsset.mutateAsync(id!);
      message.success('Asset retired');
      navigate('/assets');
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not retire asset');
    }
  };

  const handleApprove = async (allocationId: string) => {
    try {
      await approve.mutateAsync(allocationId);
      message.success('Allocation approved');
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Approval failed');
    }
  };

  const handleReject = async (allocationId: string) => {
    try {
      await reject.mutateAsync(allocationId);
      message.success('Allocation rejected');
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Rejection failed');
    }
  };

  const pendingAllocations = (asset.allocations || []).filter((a: any) => a.status === 'PENDING');

  return (
    <div style={{ padding: 0 }}>
      {/* Back + Header */}
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/assets')}
        style={{ marginBottom: 12 }}
      >
        Back to Assets
      </Button>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <Space size="middle" align="center">
              <Title level={4} style={{ margin: 0 }}>
                {asset.tag} — {asset.name}
              </Title>
              <Tag color={STATUS_COLOR[asset.status]}>{asset.status.replace(/_/g, ' ')}</Tag>
              {asset.category && <Tag>{asset.category.name}</Tag>}
            </Space>
          </div>
          <Space wrap>
            {asset.status === 'AVAILABLE' && (
              <Button type="primary" icon={<UserAddOutlined />} onClick={() => setAllocateOpen(true)}>
                Allocate
              </Button>
            )}
            {asset.status === 'ALLOCATED' && (
              <>
                <Button icon={<SwapOutlined />} onClick={() => setTransferOpen(true)}>
                  Transfer
                </Button>
                <Popconfirm title="Return this asset?" onConfirm={handleReturn}>
                  <Button icon={<RollbackOutlined />}>Return</Button>
                </Popconfirm>
              </>
            )}
            {asset.status === 'RESERVED' && (
              <Tag color="orange" style={{ fontSize: 14, padding: '4px 12px' }}>
                Pending Approval
              </Tag>
            )}
            {asset.status !== 'ALLOCATED' && (
              <Popconfirm title="Retire this asset?" onConfirm={handleDelete}>
                <Button danger icon={<DeleteOutlined />}>
                  Retire
                </Button>
              </Popconfirm>
            )}
          </Space>
        </div>

        <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
          <Descriptions.Item label="Location">{asset.location || '—'}</Descriptions.Item>
          <Descriptions.Item label="Serial Number">{asset.serialNumber || '—'}</Descriptions.Item>
          <Descriptions.Item label="QR Code">
            <Space>
              <QrcodeOutlined />
              {asset.qrCode || '—'}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Condition">{asset.condition || '—'}</Descriptions.Item>
          <Descriptions.Item label="Purchase Date">
            {asset.purchaseDate ? dayjs(asset.purchaseDate).format('DD MMM YYYY') : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Purchase Cost">
            {asset.purchaseCost != null ? `₹${Number(asset.purchaseCost).toLocaleString()}` : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Warranty Expiry">
            {asset.warrantyExpiry ? dayjs(asset.warrantyExpiry).format('DD MMM YYYY') : '—'}
          </Descriptions.Item>
          {asset.currentAllocation && (
            <Descriptions.Item label="Currently Allocated To">
              <Text strong>{asset.currentAllocation.allocatedTo?.name}</Text>
              {asset.currentAllocation.department && (
                <Text type="secondary"> — {asset.currentAllocation.department.name}</Text>
              )}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Pending Approvals */}
      {pendingAllocations.length > 0 && (
        <>
          <Divider orientation="left">Pending Approvals</Divider>
          {pendingAllocations.map((a: any) => (
            <Card key={a.id} size="small" style={{ marginBottom: 8 }}>
              <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <Text>
                  <Tag color="orange">{a.allocationType}</Tag>
                  to <Text strong>{a.allocatedTo?.name}</Text>
                  {a.reason && <Text type="secondary"> — {a.reason}</Text>}
                </Text>
                <Space>
                  <Button type="primary" size="small" onClick={() => handleApprove(a.id)}>
                    Approve
                  </Button>
                  <Button danger size="small" onClick={() => handleReject(a.id)}>
                    Reject
                  </Button>
                </Space>
              </Space>
            </Card>
          ))}
        </>
      )}

      {/* Allocation History */}
      <Divider orientation="left">Allocation History</Divider>
      {asset.allocations?.length > 0 ? (
        <Timeline
          items={(asset.allocations || []).map((a: any) => ({
            color:
              a.allocationType === 'RETURN'
                ? 'gray'
                : a.allocationType === 'TRANSFER'
                ? 'blue'
                : 'green',
            children: (
              <div>
                <Text strong>{dayjs(a.allocatedAt).format('DD MMM YYYY')}</Text>
                {' — '}
                <Tag color={ALLOC_STATUS_COLOR[a.status]} style={{ fontSize: 11 }}>
                  {a.status}
                </Tag>
                <Text>
                  {a.allocationType === 'RETURN'
                    ? `Returned by ${a.allocatedTo?.name}`
                    : a.allocationType === 'TRANSFER'
                    ? `Transfer to ${a.allocatedTo?.name}`
                    : `Allocated to ${a.allocatedTo?.name}`}
                </Text>
                {a.department && <Text type="secondary"> — {a.department.name}</Text>}
                {a.reason && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Reason: {a.reason}
                    </Text>
                  </div>
                )}
              </div>
            ),
          }))}
        />
      ) : (
        <Text type="secondary">No allocation history yet.</Text>
      )}

      {/* ── Allocate Modal ── */}
      <Modal
        title="Allocate Asset"
        open={allocateOpen}
        onCancel={() => setAllocateOpen(false)}
        onOk={() => allocateForm.submit()}
        confirmLoading={allocate.isPending}
      >
        <Form form={allocateForm} layout="vertical" onFinish={handleAllocate}>
          <Form.Item
            name="allocatedToId"
            label="Assign To"
            rules={[{ required: true, message: 'Select an employee' }]}
          >
            <Select
              placeholder="Select employee"
              showSearch
              optionFilterProp="label"
              options={(users || []).map((u: any) => ({ label: `${u.name} (${u.email})`, value: u.id }))}
            />
          </Form.Item>
          <Form.Item name="departmentId" label="Department">
            <Select
              placeholder="Select department"
              allowClear
              showSearch
              optionFilterProp="label"
              options={(departments || []).map((d: any) => ({ label: d.name, value: d.id }))}
            />
          </Form.Item>
          <Form.Item name="reason" label="Reason">
            <Input.TextArea rows={2} placeholder="Optional reason" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Transfer Modal ── */}
      <Modal
        title="Transfer Asset"
        open={transferOpen}
        onCancel={() => setTransferOpen(false)}
        onOk={() => transferForm.submit()}
        confirmLoading={transfer.isPending}
      >
        <Form form={transferForm} layout="vertical" onFinish={handleTransfer}>
          <Form.Item
            name="newAllocatedToId"
            label="Transfer To"
            rules={[{ required: true, message: 'Select an employee' }]}
          >
            <Select
              placeholder="Select employee"
              showSearch
              optionFilterProp="label"
              options={(users || []).map((u: any) => ({ label: `${u.name} (${u.email})`, value: u.id }))}
            />
          </Form.Item>
          <Form.Item name="reason" label="Reason">
            <Input.TextArea rows={2} placeholder="Reason for transfer" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

