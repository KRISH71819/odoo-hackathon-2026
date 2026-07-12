import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Tag, Space, Popconfirm, message, Typography, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, BankOutlined, EnvironmentOutlined } from '@ant-design/icons';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const { Text } = Typography;

interface Facility {
  id: string;
  name: string;
  type: string;
  capacity: number | null;
  location: string | null;
  _count?: { bookings: number };
}

export default function FacilitiesPage() {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Facility | null>(null);
  const [form] = Form.useForm();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/org/facilities');
      setFacilities(data.data);
    } catch { message.error('Failed to load facilities'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleSave = async (values: any) => {
    try {
      if (editing) {
        await api.put(`/org/facilities/${editing.id}`, values);
        message.success('Facility updated');
      } else {
        await api.post('/org/facilities', values);
        message.success('Facility created');
      }
      setModalOpen(false); form.resetFields(); setEditing(null); fetch();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/org/facilities/${id}`);
      message.success('Facility deleted'); fetch();
    } catch (err: any) { message.error(err?.response?.data?.error || 'Delete failed'); }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Room': return { bg: 'var(--primary-ghost)', color: 'var(--primary)' };
      case 'Hall': return { bg: 'var(--info-bg)', color: 'var(--info)' };
      case 'Lab': return { bg: 'var(--warning-bg)', color: 'var(--warning)' };
      default: return { bg: 'var(--bg-elevated)', color: 'var(--text-secondary)' };
    }
  };

  const columns = [
    {
      title: 'Facility',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Facility) => (
        <Space>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-md)',
            ...(() => { const c = getTypeColor(record.type); return { background: c.bg }; })(),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BankOutlined style={{ color: getTypeColor(record.type).color, fontSize: 14 }} />
          </div>
          <div>
            <Text style={{ fontWeight: 500 }}>{name}</Text>
            {record.location && (
              <Text style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>
                <EnvironmentOutlined style={{ marginRight: 4 }} />{record.location}
              </Text>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const c = getTypeColor(type);
        return <Tag style={{ background: c.bg, color: c.color, border: 'none' }}>{type}</Tag>;
      },
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (cap: number | null) => cap ? `${cap} people` : <Text style={{ color: 'var(--text-muted)' }}>N/A</Text>,
    },
    {
      title: 'Bookings',
      key: 'bookings',
      render: (_: any, record: Facility) => (
        <Tag style={{ background: 'var(--bg-elevated)', border: 'none', color: 'var(--text-secondary)' }}>
          {record._count?.bookings || 0} bookings
        </Tag>
      ),
    },
    ...(canEdit ? [{
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: Facility) => (
        <Space>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />}
              onClick={() => {
                setEditing(record);
                form.setFieldsValue({ name: record.name, type: record.type, capacity: record.capacity, location: record.location });
                setModalOpen(true);
              }} />
          </Tooltip>
          {user?.role === 'ADMIN' && (
            <Popconfirm title="Delete this facility?" onConfirm={() => handleDelete(record.id)} okButtonProps={{ danger: true }}>
              <Tooltip title="Delete"><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    }] : []),
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-header" style={{ marginBottom: 4 }}>Facilities</h1>
          <Text className="page-subtitle">Rooms, labs, and bookable spaces</Text>
        </div>
        {canEdit && (
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }} style={{ height: 40 }}>
            Add Facility
          </Button>
        )}
      </div>

      <Table dataSource={facilities} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      <Modal title={editing ? 'Edit Facility' : 'New Facility'} open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Facility Name" rules={[{ required: true, min: 2 }]}>
            <Input placeholder="e.g. Conference Room B3" />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Input placeholder="e.g. Room, Hall, Lab" />
          </Form.Item>
          <Form.Item name="capacity" label="Capacity">
            <InputNumber min={1} placeholder="Number of people" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="location" label="Location">
            <Input placeholder="e.g. 1st Floor" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">{editing ? 'Update' : 'Create'}</Button>
              <Button onClick={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
