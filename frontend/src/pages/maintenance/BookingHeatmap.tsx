import React from 'react';
import { Empty, Skeleton, Tooltip, Typography } from 'antd';
import type { BookingHeatmapCell } from '../../hooks/useMaintenance';

const { Text } = Typography;
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface BookingHeatmapProps {
  data?: BookingHeatmapCell[];
  loading?: boolean;
  compact?: boolean;
}

function cellColor(count: number, max: number) {
  if (!count) return 'rgba(71, 85, 105, 0.16)';
  const intensity = Math.max(0.2, count / max);
  return `rgba(22, 119, 255, ${0.18 + intensity * 0.78})`;
}

export default function BookingHeatmap({ data = [], loading, compact = false }: BookingHeatmapProps) {
  if (loading) return <Skeleton active paragraph={{ rows: compact ? 4 : 8 }} />;
  if (!data.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No booking activity yet" />;

  const values = new Map(data.map((cell) => [`${cell.dayOfWeek}-${cell.hour}`, cell.count]));
  const max = Math.max(...data.map((cell) => cell.count), 1);
  const hours = Array.from({ length: 12 }, (_, index) => index + 8);

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '44px repeat(12, minmax(28px, 1fr))', gap: compact ? 3 : 5, minWidth: 520 }}>
        <span />
        {hours.map((hour) => <Text key={hour} type="secondary" style={{ fontSize: 10, textAlign: 'center' }}>{hour > 12 ? `${hour - 12}P` : `${hour}A`}</Text>)}
        {days.flatMap((day, dayOfWeek) => [
          <Text key={`${day}-label`} type="secondary" style={{ fontSize: 11, alignSelf: 'center' }}>{day}</Text>,
          ...hours.map((hour) => {
            const count = values.get(`${dayOfWeek}-${hour}`) ?? 0;
            return <Tooltip key={`${dayOfWeek}-${hour}`} title={`${day} ${hour}:00 — ${count} booking${count === 1 ? '' : 's'}`}>
              <div style={{ background: cellColor(count, max), height: compact ? 22 : 30, borderRadius: 4, minWidth: 0 }} />
            </Tooltip>;
          }),
        ])}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, alignItems: 'center', marginTop: 10 }}>
        <Text type="secondary" style={{ fontSize: 11 }}>Less</Text>
        {[0.18, 0.38, 0.58, 0.78, 0.96].map((opacity) => <span key={opacity} style={{ width: 14, height: 10, borderRadius: 2, background: `rgba(22, 119, 255, ${opacity})` }} />)}
        <Text type="secondary" style={{ fontSize: 11 }}>More</Text>
      </div>
    </div>
  );
}
