import React, { useState, useCallback } from 'react';
import {
  Typography,
  Select,
  DatePicker,
  Button,
  Space,
  App as AntApp,
  Spin,
  Tag,
} from 'antd';
import {
  CalendarOutlined,
  PlusOutlined,
  BuildOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';
import BookingCalendar from './BookingCalendar';
import BookingForm from './BookingForm';

const { Title, Text } = Typography;

// ─── Resource option shape ────────────────────────────────────────────────────

interface ResourceOption {
  id: string;
  name: string;
  type: 'facility' | 'asset';
  subType?: string;
  capacity?: number;
}

// ─── Data hooks (read-only — no modification to useBookings.ts) ───────────────

function useResourceOptions() {
  const { data: facilities = [], isLoading: fLoading } = useQuery({
    queryKey: ['facilities-for-booking'],
    queryFn: () => client.get('/org/facilities').then((r) => r.data.data ?? r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: assets = [], isLoading: aLoading } = useQuery({
    queryKey: ['assets-for-booking'],
    queryFn: () => client.get('/assets').then((r) => r.data.data ?? r.data),
    staleTime: 5 * 60 * 1000,
  });

  const options: ResourceOption[] = [
    ...(facilities as Array<{ id: string; name: string; type: string; capacity?: number }>).map(
      (f) => ({ id: f.id, name: f.name, type: 'facility' as const, subType: f.type, capacity: f.capacity })
    ),
    ...(assets as Array<{ id: string; name: string; category?: { name: string }; status: string }>)
      .filter((a) => a.status !== 'UNDER_MAINTENANCE' && a.status !== 'RETIRED')
      .map((a) => ({ id: a.id, name: a.name, type: 'asset' as const, subType: a.category?.name })),
  ];

  return { options, isLoading: fLoading || aLoading };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResourceBookingPage() {
  const { message } = AntApp.useApp();
  const today = dayjs();

  const [selectedResourceId, setSelectedResourceId] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(today);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { options, isLoading: resourcesLoading } = useResourceOptions();
  const selectedResource = options.find((o) => o.id === selectedResourceId);

  const handleBookSuccess = useCallback(() => {
    setIsFormOpen(false);
    message.success('Booking created successfully!');
  }, [message]);

  const selectOptions = options.map((o) => ({
    value: o.id,
    label: (
      <Space size={6}>
        {o.type === 'facility' ? (
          <BuildOutlined style={{ color: 'var(--primary)' }} />
        ) : (
          <AppstoreOutlined style={{ color: 'var(--warning)' }} />
        )}
        <span>{o.name}</span>
        {o.subType && (
          <Tag
            style={{
              fontSize: 10,
              marginLeft: 2,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            {o.subType}
          </Tag>
        )}
        {o.capacity && (
          <Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Cap: {o.capacity}
          </Text>
        )}
      </Space>
    ),
    searchLabel: o.name,
  }));

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <Space align="center" style={{ gap: 10, marginBottom: 4 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--primary-ghost)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              fontSize: 18,
            }}
          >
            <CalendarOutlined />
          </div>
          <Title
            level={3}
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
            }}
          >
            Resource Booking
          </Title>
        </Space>
        <Text style={{ color: 'var(--text-secondary)', marginLeft: 46 }}>
          Select a resource and date to view availability and book a slot.
        </Text>
      </div>

      {/* ── Top Controls Bar ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <Select
          showSearch
          allowClear
          placeholder="Select a facility or asset…"
          style={{ flex: '1 1 260px', minWidth: 220 }}
          loading={resourcesLoading}
          value={selectedResourceId}
          onChange={setSelectedResourceId}
          options={selectOptions}
          filterOption={(input, option) =>
            (option?.searchLabel ?? '').toLowerCase().includes(input.toLowerCase())
          }
          optionLabelProp="label"
          size="large"
          notFoundContent={
            resourcesLoading ? <Spin size="small" /> : 'No resources found'
          }
        />

        <DatePicker
          value={selectedDate}
          onChange={(d) => d && setSelectedDate(d)}
          format="ddd, D MMM YYYY"
          allowClear={false}
          size="large"
          style={{ width: 200 }}
          disabledDate={(d) => d.isBefore(dayjs().startOf('day'))}
        />

        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => setIsFormOpen(true)}
          disabled={!selectedResourceId}
          style={{
            background: selectedResourceId
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : undefined,
            border: 'none',
            fontWeight: 600,
            boxShadow: selectedResourceId
              ? '0 4px 12px rgba(16, 185, 129, 0.3)'
              : undefined,
          }}
        >
          Book a Slot
        </Button>
      </div>

      {/* ── Calendar ─────────────────────────────────────────────────────── */}
      {selectedResourceId && selectedResource ? (
        <BookingCalendar
          resourceId={selectedResourceId}
          resourceType={selectedResource.type}
          date={selectedDate}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-strong)',
            gap: 12,
          }}
        >
          <CalendarOutlined style={{ fontSize: 48, color: 'var(--text-muted)' }} />
          <Text style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            Select a resource above to view its booking calendar
          </Text>
        </div>
      )}

      {/* ── Bottom Book Button ───────────────────────────────────────────── */}
      {selectedResourceId && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setIsFormOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              fontWeight: 600,
              paddingInline: 32,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            }}
          >
            Book a Slot
          </Button>
        </div>
      )}

      {/* ── Booking Form Modal ───────────────────────────────────────────── */}
      {selectedResource && (
        <BookingForm
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          resourceId={selectedResource.id}
          resourceType={selectedResource.type}
          resourceLabel={selectedResource.name}
          defaultDate={selectedDate}
          onSuccess={handleBookSuccess}
        />
      )}
    </div>
  );
}
