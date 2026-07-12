import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Tag, Space, Popconfirm, message, Typography, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, TagsOutlined } from '@ant-design/icons';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const { Text } = Typography;

interface Category {
  id: string;
  name: string;
  _count?: { assets: number };
}

export default function CategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form] = Form.useForm();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/org/categories');
      setCategories(data.data);
    } catch { message.error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleSave = async (values: any) => {
    try {
      if (editing) {
        await api.put(`/org/categories/${editing.id}`, values);
        message.success('Category updated');
      } else {
        await api.post('/org/categories', values);
        message.success('Category created');
      }
      setModalOpen(false); form.resetFields(); setEditing(null); fetch();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/org/categories/${id}`);
      message.success('Category deleted'); fetch();
    } catch (err: any) { message.error(err?.response?.data?.error || 'Delete failed'); }
  };

  const columns = [
    {
      title: 'Category',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-md)',
            background: 'var(--info-bg)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <TagsOutlined style={{ color: 'var(--info)', fontSize: 14 }} />
          </div>
          <Text style={{ fontWeight: 500 }}>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Assets Count',
      key: 'count',
      render: (_: any, record: Category) => (
        <Tag style={{ background: 'var(--bg-elevated)', border: 'none', color: 'var(--text-secondary)' }}>
          {record._count?.assets || 0} assets
        </Tag>
      ),
    },
    ...(canEdit ? [{
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: Category) => (
        <Space>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />}
              onClick={() => { setEditing(record); form.setFieldsValue({ name: record.name }); setModalOpen(true); }} />
          </Tooltip>
          {user?.role === 'ADMIN' && (
            <Popconfirm title="Delete this category?" onConfirm={() => handleDelete(record.id)} okButtonProps={{ danger: true }}>
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
          <h1 className="page-header" style={{ marginBottom: 4 }}>Categories</h1>
          <Text className="page-subtitle">Classify and organize assets by type</Text>
        </div>
        {canEdit && (
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }} style={{ height: 40 }}>
            Add Category
          </Button>
        )}
      </div>

      <Table dataSource={categories} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      <Modal title={editing ? 'Edit Category' : 'New Category'} open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditing(null); form.resetFields(); }} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Category Name" rules={[{ required: true, min: 2 }]}>
            <Input placeholder="e.g. Electronics" />
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
