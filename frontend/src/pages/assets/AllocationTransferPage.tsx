import React, { useState } from 'react';
import {
  Card,
  Select,
  Typography,
  Tag,
  Alert,
  Form,
  Input,
  Button,
  Divider,
  Table,
  Space,
  Spin,
  message,
  Empty,
} from 'antd';
import { SwapOutlined, UserAddOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useAssets,
  useAsset,
  useAllocateAsset,
  useTransferAsset,
  useAllocationHistory,
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

export default function AllocationTransferPage() {
  const [selectedAssetId, setSelectedAssetId] = useState<string | undefined>();
  const [allocateForm] = Form.useForm();
  const [transferForm] = Form.useForm();

  // Fetch all assets for the selector
  const { data: assetsData } = useAssets({ limit: 200 });
  const { data: asset, isLoading: assetLoading } = useAsset(selectedAssetId);
  const { data: history } = useAllocationHistory(selectedAssetId);
  const { data: users } = useUsers();
  const { data: departments } = useDepartments();

  const allocate = useAllocateAsset();
  const transfer = useTransferAsset();

  const handleAllocate = async (values: any) => {
    try {
      await allocate.mutateAsync({ id: selectedAssetId!, data: values });
      message.success('Allocation request created successfully');
      allocateForm.resetFields();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Allocation failed');
    }
  };

  const handleTransfer = async (values: any) => {
    try {
      await transfer.mutateAsync({
        id: selectedAssetId!,
        data: { newAllocatedToId: values.newAllocatedToId, reason: values.reason },
      });
      message.success('Transfer request submitted');
      transferForm.resetFields();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Transfer failed');
    }
  };

  const historyColumns = [
    {
      title: 'Date',
      dataIndex: 'allocatedAt',
      key: 'date',
      width: 130,
      render: (d: string) => dayjs(d).format('DD MMM YYYY'),
    },
    {
      title: 'Type',
      dataIndex: 'allocationType',
      key: 'type',
      width: 100,
      render: (t: string) => (
        <Tag color={t === 'RETURN' ? 'default' : t === 'TRANSFER' ? 'blue' : 'green'}>
          {t}
        </Tag>
      ),
    },
    {
      title: 'Employee',
      key: 'employee',
      render: (_: any, r: any) => r.allocatedTo?.name || '—',
    },
    {
      title: 'Department',
      key: 'dept',
      render: (_: any, r: any) => r.department?.name || '—',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => (
        <Tag color={s === 'APPROVED' ? 'green' : s === 'PENDING' ? 'orange' : 'red'}>{s}</Tag>
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (r: string) => r || '—',
    },
  ];

  return (
    <div style={{ padding: 0 }}>
      <Title level={3}>Allocation &amp; Transfer</Title>

      {/* Asset Selector */}
      <Card style={{ marginBottom: 16 }}>
        <Form.Item label="Select Asset" style={{ marginBottom: 0 }}>
          <Select
            placeholder="Search by name or tag..."
            showSearch
            optionFilterProp="label"
            style={{ width: '100%', maxWidth: 500 }}
            value={selectedAssetId}
            onChange={setSelectedAssetId}
            allowClear
            options={(assetsData?.data || []).map((a: any) => ({
              label: `${a.tag} — ${a.name}`,
              value: a.id,
            }))}
          />
        </Form.Item>
      </Card>

      {/* Asset Details + Actions */}
      {selectedAssetId && assetLoading && (
        <Spin style={{ display: 'block', margin: '40px auto' }} />
      )}

      {asset && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Space size="middle" align="center" style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 16 }}>
                {asset.tag} — {asset.name}
              </Text>
              <Tag color={STATUS_COLOR[asset.status]}>{asset.status.replace(/_/g, ' ')}</Tag>
            </Space>

            {/* ALLOCATED → Show warning + Transfer form */}
            {asset.status === 'ALLOCATED' && asset.currentAllocation && (
              <>
                <Alert
                  type="warning"
                  showIcon
                  message={
                    <>
                      Already allocated to{' '}
                      <Text strong>{asset.currentAllocation.allocatedTo?.name}</Text>
                      {asset.currentAllocation.department && (
                        <> ({asset.currentAllocation.department.name})</>
                      )}
                      . This asset is blocked — submit a transfer request below.
                    </>
                  }
                  style={{ marginBottom: 20 }}
                />

                <Divider orientation="left">
                  <SwapOutlined /> Transfer Request
                </Divider>
                <Form form={transferForm} layout="vertical" onFinish={handleTransfer} style={{ maxWidth: 500 }}>
                  <Form.Item label="From">
                    <Input disabled value={asset.currentAllocation.allocatedTo?.name} />
                  </Form.Item>
                  <Form.Item
                    name="newAllocatedToId"
                    label="Transfer To"
                    rules={[{ required: true, message: 'Select an employee' }]}
                  >
                    <Select
                      placeholder="Select employee"
                      showSearch
                      optionFilterProp="label"
                      options={(users || []).map((u: any) => ({
                        label: `${u.name} (${u.email})`,
                        value: u.id,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item name="reason" label="Reason">
                    <Input.TextArea rows={3} placeholder="Reason for transfer" />
                  </Form.Item>
                  <Button
                    type="primary"
                    icon={<SwapOutlined />}
                    loading={transfer.isPending}
                    onClick={() => transferForm.submit()}
                  >
                    Submit Transfer Request
                  </Button>
                </Form>
              </>
            )}

            {/* AVAILABLE → Allocate form */}
            {asset.status === 'AVAILABLE' && (
              <>
                <Divider orientation="left">
                  <UserAddOutlined /> Allocate Asset
                </Divider>
                <Form form={allocateForm} layout="vertical" onFinish={handleAllocate} style={{ maxWidth: 500 }}>
                  <Form.Item
                    name="allocatedToId"
                    label="Assign To"
                    rules={[{ required: true, message: 'Select an employee' }]}
                  >
                    <Select
                      placeholder="Select employee"
                      showSearch
                      optionFilterProp="label"
                      options={(users || []).map((u: any) => ({
                        label: `${u.name} (${u.email})`,
                        value: u.id,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item name="departmentId" label="Department">
                    <Select
                      placeholder="Select department"
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      options={(departments || []).map((d: any) => ({
                        label: d.name,
                        value: d.id,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item name="reason" label="Reason">
                    <Input.TextArea rows={3} placeholder="Optional reason for allocation" />
                  </Form.Item>
                  <Button
                    type="primary"
                    icon={<UserAddOutlined />}
                    loading={allocate.isPending}
                    onClick={() => allocateForm.submit()}
                  >
                    Allocate
                  </Button>
                </Form>
              </>
            )}

            {/* RESERVED → Pending */}
            {asset.status === 'RESERVED' && (
              <Alert
                type="info"
                showIcon
                message="This asset is reserved and awaiting approval."
                style={{ marginTop: 16 }}
              />
            )}

            {/* RETIRED / UNDER_MAINTENANCE */}
            {(asset.status === 'RETIRED' || asset.status === 'UNDER_MAINTENANCE') && (
              <Alert
                type="error"
                showIcon
                message={`This asset is ${asset.status.replace(/_/g, ' ').toLowerCase()} and cannot be allocated.`}
                style={{ marginTop: 16 }}
              />
            )}
          </Card>

          {/* Allocation History */}
          <Divider orientation="left">Allocation History</Divider>
          <Table
            columns={historyColumns}
            dataSource={history || []}
            rowKey="id"
            pagination={false}
            scroll={{ x: 600 }}
            size="small"
            locale={{ emptyText: 'No allocation history' }}
          />
        </>
      )}

      {!selectedAssetId && (
        <Empty description="Select an asset to view allocation details" style={{ marginTop: 60 }} />
      )}
    </div>
  );
}
