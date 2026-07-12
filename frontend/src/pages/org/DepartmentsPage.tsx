import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, Popconfirm, message, Typography, Tooltip, Badge } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined, ApartmentOutlined } from '@ant-design/icons';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const { Text } = Typography;

interface Department {
  id: string;
  name: string;
  headName: string | null;
  status: string;
  parentId: string | null;
  parent: { id: string; name: string } | null;
  children: { id: string; name: string }[];
  _count?: { users: number };
}

export default function DepartmentsPage() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form] = Form.useForm();
  const isAdmin = user?.role === 'ADMIN';

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/org/departments');
      setDepartments(data.data);
    } catch (err) {
      message.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const handleSave = async (values: any) => {
    try {
      if (editing) {
        await api.put(`/org/departments/${editing.id}`, values);
        message.success('Department updated');
      } else {
        await api.post('/org/departments', values);
        message.success('Department created');
      }
      setModalOpen(false);
      form.resetFields();
      setEditing(null);
      fetchDepartments();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/org/departments/${id}`);
      message.success('Department deleted');
      fetchDepartments();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Delete failed');
    }
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    form.setFieldsValue({
      name: dept.name,
      headName: dept.headName,
      parentId: dept.parentId,
    });
    setModalOpen(true);
  };

  const columns = [
    {
      title: 'Department',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Department) => (
        <Space>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-md)',
            background: 'var(--primary-ghost)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <ApartmentOutlined style={{ color: 'var(--primary)', fontSize: 14 }} />
          </div>
          <div>
            <Text style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{name}</Text>
            {record.parent && (
              <Text style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>
                under {record.parent.name}
              </Text>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Head',
      dataIndex: 'headName',
      key: 'headName',
      render: (head: string | null) => head || <Text style={{ color: 'var(--text-muted)' }}>Unassigned</Text>,
    },
    {
      title: 'Members',
      key: 'members',
      render: (_: any, record: Department) => (
        <Badge count={record._count?.users || 0} showZero color="var(--bg-hover)" style={{ color: 'var(--text-secondary)' }}>
          <TeamOutlined style={{ fontSize: 16, color: 'var(--text-secondary)', padding: '4px 8px' }} />
        </Badge>
      ),
    },
    {
      title: 'Sub-departments',
      key: 'children',
      render: (_: any, record: Department) => (
        <Space size={4} wrap>
          {record.children.length > 0
            ? record.children.map(c => (
                <Tag key={c.id} style={{ background: 'var(--bg-elevated)', border: 'none', color: 'var(--text-secondary)' }}>
                  {c.name}
                </Tag>
              ))
            : <Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>None</Text>
          }
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag className={status === 'Active' ? 'status-available' : 'status-retired'}>
          {status}
        </Tag>
      ),
    },
    ...(isAdmin ? [{
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: Department) => (
        <Space>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Popconfirm title="Delete this department?" onConfirm={() => handleDelete(record.id)} okText="Delete" okButtonProps={{ danger: true }}>
            <Tooltip title="Delete">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    }] : []),
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-header" style={{ marginBottom: 4 }}>Departments</h1>
          <Text className="page-subtitle">Manage organizational structure and team assignments</Text>
        </div>
        {isAdmin && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}
            style={{ height: 40 }}
          >
            Add Department
          </Button>
        )}
      </div>

      <Table
        dataSource={departments}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
      />

      <Modal
        title={editing ? 'Edit Department' : 'New Department'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Department Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Engineering" />
          </Form.Item>
          <Form.Item name="headName" label="Department Head">
            <Input placeholder="Head name (optional)" />
          </Form.Item>
          <Form.Item name="parentId" label="Parent Department">
            <Select placeholder="Select parent (optional)" allowClear>
              {departments
                .filter(d => d.id !== editing?.id)
                .map(d => (
                  <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
                ))
              }
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editing ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => { setModalOpen(false); setEditing(null); form.resetFields(); }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
