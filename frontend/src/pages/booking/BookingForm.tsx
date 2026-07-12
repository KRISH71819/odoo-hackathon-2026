import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  Form,
  Input,
  DatePicker,
  TimePicker,
  Switch,
  Select,
  InputNumber,
  Button,
  Alert,
  Space,
  Typography,
  App as AntApp,
  Divider,
} from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import {
  useCreateBooking,
  useCheckConflict,
} from '../../hooks/useBookings';
import type { ConflictBooking } from '../../hooks/useBookings';

const { Text } = Typography;
const { TextArea } = Input;

// ─── Props ────────────────────────────────────────────────────────────────────

interface BookingFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  resourceId: string;
  resourceType: 'facility' | 'asset';
  resourceLabel: string;
  defaultDate: Dayjs;
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

/** Build a combined ISO datetime from a date Dayjs + a time Dayjs */
function combineDatetime(date: Dayjs, time: Dayjs): string {
  return date
    .hour(time.hour())
    .minute(time.minute())
    .second(0)
    .millisecond(0)
    .toISOString();
}

/** Disable hours outside the allowed range for start/end time pickers */
function disabledStartHours() {
  const disabled: number[] = [];
  for (let h = 0; h < 8; h++) disabled.push(h);
  for (let h = 18; h < 24; h++) disabled.push(h);
  return disabled;
}

function disabledEndHours() {
  const disabled: number[] = [];
  for (let h = 0; h < 9; h++) disabled.push(h);
  for (let h = 19; h < 24; h++) disabled.push(h);
  return disabled;
}

// ─── Form values ──────────────────────────────────────────────────────────────

interface FormValues {
  title: string;
  purpose?: string;
  date: Dayjs;
  startTime: Dayjs;
  endTime: Dayjs;
  isRecurring: boolean;
  recurrenceType?: 'WEEKLY' | 'BIWEEKLY';
  recurrenceWeeks?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingForm({
  open,
  onClose,
  onSuccess,
  resourceId,
  resourceType,
  resourceLabel,
  defaultDate,
}: BookingFormProps) {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<FormValues>();

  const [isRecurring, setIsRecurring] = useState(false);
  const [conflictStatus, setConflictStatus] = useState<
    'idle' | 'checking' | 'available' | 'conflict'
  >('idle');
  const [conflicts, setConflicts] = useState<ConflictBooking[]>([]);

  const createBooking = useCreateBooking();
  const checkConflict = useCheckConflict();

  // ── Reset form on open/close ───────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ date: defaultDate, isRecurring: false });
      setIsRecurring(false);
      setConflictStatus('idle');
      setConflicts([]);
    }
  }, [open, defaultDate, form]);

  // ── Real-time conflict check ───────────────────────────────────────────────
  const runConflictCheck = useCallback(async () => {
    const values = form.getFieldsValue();
    const { date, startTime, endTime } = values;
    if (!date || !startTime || !endTime) return;
    if (!endTime.isAfter(startTime)) return;

    const startIso = combineDatetime(date, startTime);
    const endIso = combineDatetime(date, endTime);

    setConflictStatus('checking');
    setConflicts([]);

    try {
      const payload =
        resourceType === 'facility'
          ? { facilityId: resourceId, startTime: startIso, endTime: endIso }
          : { assetId: resourceId, startTime: startIso, endTime: endIso };

      const result = await checkConflict.mutateAsync(payload);
      if (result.hasConflict) {
        setConflictStatus('conflict');
        setConflicts(result.conflicts);
      } else {
        setConflictStatus('available');
        setConflicts([]);
      }
    } catch {
      // Silently fail the conflict check — don't block the form
      setConflictStatus('idle');
    }
  }, [form, resourceId, resourceType, checkConflict]);

  // ── Form submission ────────────────────────────────────────────────────────
  const handleSubmit = async (values: FormValues) => {
    if (conflictStatus === 'conflict') return;

    const startIso = combineDatetime(values.date, values.startTime);
    const endIso = combineDatetime(values.date, values.endTime);

    let recurRule: string | undefined;
    if (values.isRecurring && values.recurrenceType) {
      recurRule = values.recurrenceType;
    }

    const payload = {
      ...(resourceType === 'facility'
        ? { facilityId: resourceId }
        : { assetId: resourceId }),
      title: values.title,
      purpose: values.purpose,
      startTime: startIso,
      endTime: endIso,
      isRecurring: values.isRecurring,
      recurRule,
    };

    try {
      await createBooking.mutateAsync(payload);
      onSuccess();
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { error?: string; conflicts?: ConflictBooking[] } };
      };
      const serverMsg = e.response?.data?.error ?? 'Failed to create booking';
      const serverConflicts = e.response?.data?.conflicts;

      if (serverConflicts && serverConflicts.length > 0) {
        setConflictStatus('conflict');
        setConflicts(serverConflicts);
      }

      message.error(serverMsg);
    }
  };

  const isSubmitting = createBooking.isPending;
  const isChecking = conflictStatus === 'checking';
  const submitDisabled = isSubmitting || isChecking || conflictStatus === 'conflict';

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <Space>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              color: '#fff',
              fontWeight: 700,
            }}
          >
            +
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
            Book a Slot
          </span>
        </Space>
      }
      footer={null}
      width={520}
      destroyOnClose
      styles={{
        content: { background: 'var(--bg-surface)', padding: 0 },
        header: {
          background: 'var(--bg-surface)',
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border-subtle)',
        },
        body: { padding: '20px 24px 24px' },
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ isRecurring: false }}
        requiredMark={false}
        style={{ gap: 0 }}
      >
        {/* ── Resource (read-only) ──────────────────────────────────────── */}
        <Form.Item label={<Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Resource</Text>}>
          <div
            style={{
              padding: '8px 12px',
              background: 'var(--bg-elevated)',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: resourceType === 'facility' ? 'var(--primary)' : 'var(--warning)',
                flexShrink: 0,
              }}
            />
            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{resourceLabel}</span>
            <Text style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              ({resourceType})
            </Text>
          </div>
        </Form.Item>

        {/* ── Title ──────────────────────────────────────────────────────── */}
        <Form.Item
          name="title"
          label="Title"
          rules={[
            { required: true, message: 'Title is required' },
            { min: 2, message: 'Title must be at least 2 characters' },
          ]}
        >
          <Input placeholder="e.g. Team standup, Equipment test" maxLength={100} />
        </Form.Item>

        {/* ── Purpose ────────────────────────────────────────────────────── */}
        <Form.Item name="purpose" label="Purpose (optional)">
          <TextArea
            placeholder="Brief description of why you need this resource…"
            rows={2}
            maxLength={300}
            showCount
          />
        </Form.Item>

        {/* ── Date ───────────────────────────────────────────────────────── */}
        <Form.Item
          name="date"
          label="Date"
          rules={[{ required: true, message: 'Please select a date' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            disabledDate={(d) => d.isBefore(dayjs().startOf('day'))}
            format="ddd, D MMM YYYY"
          />
        </Form.Item>

        {/* ── Start / End Time ───────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item
            name="startTime"
            label="Start Time"
            rules={[{ required: true, message: 'Required' }]}
          >
            <TimePicker
              style={{ width: '100%' }}
              format="h:00 A"
              showNow={false}
              minuteStep={60}
              disabledTime={() => ({ disabledHours: disabledStartHours })}
              onChange={runConflictCheck}
              needConfirm={false}
            />
          </Form.Item>

          <Form.Item
            name="endTime"
            label="End Time"
            dependencies={['startTime']}
            rules={[
              { required: true, message: 'Required' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const start = getFieldValue('startTime') as Dayjs | undefined;
                  if (!value || !start || value.isAfter(start)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('End time must be after start time'));
                },
              }),
            ]}
          >
            <TimePicker
              style={{ width: '100%' }}
              format="h:00 A"
              showNow={false}
              minuteStep={60}
              disabledTime={() => ({ disabledHours: disabledEndHours })}
              onChange={runConflictCheck}
              needConfirm={false}
            />
          </Form.Item>
        </div>

        {/* ── Conflict status indicator ───────────────────────────────────── */}
        {conflictStatus === 'checking' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <LoadingOutlined style={{ color: 'var(--primary)', fontSize: 14 }} />
            <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
              Checking availability…
            </Text>
          </div>
        )}

        {conflictStatus === 'available' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
              padding: '8px 12px',
              background: 'rgba(16,185,129,0.08)',
              borderRadius: 8,
              border: '1px solid rgba(16,185,129,0.2)',
            }}
          >
            <CheckCircleOutlined style={{ color: '#10b981', fontSize: 14 }} />
            <Text style={{ color: '#10b981', fontSize: 12, fontWeight: 500 }}>
              Slot available! No conflicts found.
            </Text>
          </div>
        )}

        {conflictStatus === 'conflict' && conflicts.length > 0 && (
          <Alert
            type="error"
            showIcon
            icon={<WarningOutlined />}
            message="Booking Conflict"
            description={
              <div style={{ marginTop: 4 }}>
                {conflicts.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: '6px 0',
                      borderBottom: '1px solid rgba(239,68,68,0.15)',
                      fontSize: 12,
                    }}
                  >
                    <Text strong style={{ color: 'var(--text-primary)' }}>
                      {c.title}
                    </Text>
                    <Text style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>
                      {dayjs(c.startTime).format('h:mm A')} –{' '}
                      {dayjs(c.endTime).format('h:mm A')}
                    </Text>
                    {c.bookedBy && (
                      <Text style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 11 }}>
                        by {c.bookedBy.name}
                      </Text>
                    )}
                  </div>
                ))}
              </div>
            }
            style={{ marginBottom: 12, borderRadius: 8 }}
          />
        )}

        {/* ── Recurring toggle ─────────────────────────────────────────────── */}
        <Divider style={{ margin: '8px 0 16px', borderColor: 'var(--border-subtle)' }} />

        <Form.Item
          name="isRecurring"
          valuePropName="checked"
          style={{ marginBottom: 12 }}
        >
          <Space align="center">
            <Switch
              onChange={(val) => {
                setIsRecurring(val);
                if (!val) {
                  form.setFieldsValue({ recurrenceType: undefined, recurrenceWeeks: undefined });
                }
              }}
              style={{
                background: isRecurring ? '#10b981' : undefined,
              }}
            />
            <Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              Recurring booking
            </Text>
          </Space>
        </Form.Item>

        {isRecurring && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              padding: '12px 16px',
              background: 'var(--bg-elevated)',
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              marginBottom: 16,
            }}
          >
            <Form.Item
              name="recurrenceType"
              label="Frequency"
              rules={[{ required: isRecurring, message: 'Required' }]}
              style={{ marginBottom: 0 }}
            >
              <Select
                placeholder="Select frequency"
                options={[
                  { value: 'WEEKLY', label: 'Weekly' },
                  { value: 'BIWEEKLY', label: 'Biweekly (every 2 weeks)' },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="recurrenceWeeks"
              label="For how many weeks"
              rules={[{ required: isRecurring, message: 'Required' }]}
              style={{ marginBottom: 0 }}
            >
              <InputNumber
                min={1}
                max={12}
                style={{ width: '100%' }}
                placeholder="e.g. 4"
                addonAfter="weeks"
              />
            </Form.Item>
          </div>
        )}

        {/* ── Footer buttons ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
            disabled={submitDisabled}
            style={{
              background:
                submitDisabled
                  ? undefined
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              fontWeight: 600,
              boxShadow: submitDisabled ? 'none' : '0 4px 12px rgba(16,185,129,0.3)',
            }}
          >
            {isChecking ? 'Checking…' : isSubmitting ? 'Booking…' : 'Confirm Booking'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
