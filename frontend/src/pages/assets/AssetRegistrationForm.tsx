import React from 'react';
import { Drawer, Form, Input, Select, DatePicker, InputNumber, Button, Alert, message, Space } from 'antd';
import { useCreateAsset, useCategories } from '../../hooks/useAssets';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AssetRegistrationForm({ open, onClose }: Props) {
  const [form] = Form.useForm();
  const createAsset = useCreateAsset();
  const { data: categories } = useCategories();

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        purchaseDate: values.purchaseDate?.toISOString(),
        warrantyExpiry: values.warrantyExpiry?.toISOString(),
      };
      await createAsset.mutateAsync(payload);
      message.success('Asset registered successfully!');
      form.resetFields();
      onClose();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Failed to register asset');
    }
  };

  return (
    <Drawer
      title="Register New Asset"
      open={open}
      onClose={onClose}
      width={480}
      destroyOnClose
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            loading={createAsset.isPending}
            onClick={() => form.submit()}
          >
            Register
          </Button>
        </Space>
      }
    >
      <Alert
        message="Tag will be auto-assigned (e.g., AF-0017)"
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="name"
          label="Asset Name"
          rules={[{ required: true, message: 'Please enter asset name' }]}
        >
          <Input placeholder="e.g., Dell Latitude 5520" />
        </Form.Item>

        <Form.Item
          name="categoryId"
          label="Category"
          rules={[{ required: true, message: 'Please select a category' }]}
        >
          <Select
            placeholder="Select category"
            showSearch
            optionFilterProp="label"
            options={(categories || []).map((c: any) => ({
              label: c.name,
              value: c.id,
            }))}
          />
        </Form.Item>

        <Form.Item name="location" label="Location">
          <Input placeholder="e.g., 1st Floor, Room 201" />
        </Form.Item>

        <Form.Item name="purchaseDate" label="Purchase Date">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="purchaseCost" label="Purchase Cost (₹)">
          <InputNumber min={0} style={{ width: '100%' }} placeholder="0.00" />
        </Form.Item>

        <Form.Item name="warrantyExpiry" label="Warranty Expiry">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="serialNumber" label="Serial Number">
          <Input placeholder="e.g., SN-12345-XYZ" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
