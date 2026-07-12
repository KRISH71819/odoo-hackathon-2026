import React, { useMemo } from 'react';
import { Spin, Alert, Typography } from 'antd';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useAvailability } from '../../hooks/useBookings';
import type { Booking, BookingStatus } from '../../hooks/useBookings';

const { Text } = Typography;

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUR_START = 8;
const HOUR_END = 18;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const ROW_HEIGHT = 60;
const ROW_HEIGHT_MOBILE = 48;
const HOURS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => HOUR_START + i);

// ─── Status styling ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<BookingStatus, React.CSSProperties> = {
  UPCOMING: {
    background: 'rgba(22, 119, 255, 0.85)',
    border: '1px solid #1677ff',
    color: '#fff',
  },
  ONGOING: {
    background: 'rgba(16, 185, 129, 0.85)',
    border: '1px solid #10b981',
    color: '#fff',
  },
  COMPLETED: {
    background: 'rgba(140, 140, 140, 0.45)',
    border: '1px solid #52525b',
    color: '#a1a1aa',
  },
  CANCELLED: {
    background: `repeating-linear-gradient(
      -45deg,
      rgba(239,68,68,0.06) 0px,
      rgba(239,68,68,0.06) 6px,
      transparent 6px,
      transparent 12px
    )`,
    border: '1px solid rgba(239,68,68,0.2)',
    color: '#71717a',
    opacity: 0.65,
  },
};

const STATUS_BADGE: Record<BookingStatus, string> = {
  UPCOMING: 'Upcoming',
  ONGOING: 'Live',
  COMPLETED: 'Done',
  CANCELLED: 'Cancelled',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toMinutes(iso: string): number {
  const d = dayjs(iso);
  return d.hour() * 60 + d.minute();
}

function fmt12(iso: string): string {
  return dayjs(iso).format('h:mm A');
}

function hourLabel(h: number): string {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00 ${suffix}`;
}

function blockGeometry(startIso: string, endIso: string, rowHeight: number) {
  const startMin = toMinutes(startIso);
  const endMin = toMinutes(endIso);
  const clampedStart = Math.max(startMin, HOUR_START * 60);
  const clampedEnd = Math.min(endMin, HOUR_END * 60);
  const top = ((clampedStart - HOUR_START * 60) / 60) * rowHeight;
  const height = Math.max(((clampedEnd - clampedStart) / 60) * rowHeight, 24);
  return { top, height };
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PendingSlot {
  startTime: string;
  endTime: string;
  hasConflict: boolean;
}

interface BookingCalendarProps {
  resourceId: string;
  resourceType: 'facility' | 'asset';
  date: Dayjs;
  pendingSlot?: PendingSlot;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingCalendar({
  resourceId,
  resourceType,
  date,
  pendingSlot,
}: BookingCalendarProps) {
  const dateStr = date.format('YYYY-MM-DD');
  const { bookings, loading, error } = useAvailability(resourceId, resourceType, dateStr);

  const sorted = useMemo(
    () => [...bookings].sort((a, b) => dayjs(a.startTime).diff(dayjs(b.startTime))),
    [bookings]
  );

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const rowH = isMobile ? ROW_HEIGHT_MOBILE : ROW_HEIGHT;
  const totalHeight = TOTAL_HOURS * rowH;

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: totalHeight,
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <Spin size="large" tip="Loading schedule…" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message="Failed to load availability"
        description={(error as Error).message}
        style={{ borderRadius: 'var(--radius-lg)' }}
      />
    );
  }

  return (
    <>
      <style>{`
        @keyframes booking-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
          70%  { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
        .booking-block-ONGOING {
          animation: booking-pulse 2s ease-in-out infinite;
        }
      `}</style>

      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: '20px 16px',
          overflow: 'hidden',
        }}
      >
        {/* Date header */}
        <div style={{ marginBottom: 16, paddingLeft: isMobile ? 0 : 80 }}>
          <Text
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--primary)',
            }}
          >
            {date.format('dddd, D MMMM YYYY')}
          </Text>
          {sorted.length > 0 && (
            <Text style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 12 }}>
              {sorted.length} booking{sorted.length !== 1 ? 's' : ''}
            </Text>
          )}
        </div>

        {/* Timeline wrapper */}
        <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>

          {/* Hour labels */}
          <div
            style={{
              width: isMobile ? '100%' : 72,
              flexShrink: 0,
              position: 'relative',
              height: isMobile ? 'auto' : totalHeight,
              display: isMobile ? 'flex' : 'block',
              flexWrap: 'wrap',
            }}
          >
            {HOURS.map((h, i) => (
              <div
                key={h}
                style={{
                  position: isMobile ? 'relative' : 'absolute',
                  top: isMobile ? undefined : i * rowH,
                  width: isMobile ? `${100 / (TOTAL_HOURS + 1)}%` : '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  paddingTop: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {hourLabel(h)}
                </Text>
              </div>
            ))}
          </div>

          {/* Timeline body */}
          <div style={{ flex: 1, position: 'relative', height: totalHeight, minWidth: 0 }}>

            {/* Grid lines */}
            {HOURS.map((h, i) => (
              <div
                key={`grid-${h}`}
                style={{
                  position: 'absolute',
                  top: i * rowH,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: i === 0 ? 'var(--border-strong)' : 'var(--border-subtle)',
                  opacity: i === 0 ? 1 : 0.5,
                }}
              />
            ))}

            {/* Empty state */}
            {sorted.length === 0 && !pendingSlot && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  pointerEvents: 'none',
                }}
              >
                <Text style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  No bookings for this date
                </Text>
                <Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  All slots are available 8:00 AM – 6:00 PM
                </Text>
              </div>
            )}

            {/* Back-to-back green dividers */}
            {sorted.map((booking, idx) => {
              if (idx === 0) return null;
              const prev = sorted[idx - 1];
              const prevEndMs = dayjs(prev.endTime).valueOf();
              const currStartMs = dayjs(booking.startTime).valueOf();
              if (prevEndMs !== currStartMs) return null;
              const divTop = blockGeometry(booking.startTime, booking.endTime, rowH).top;
              return (
                <div
                  key={`btb-${booking.id}`}
                  style={{
                    position: 'absolute',
                    top: divTop,
                    left: 4,
                    right: 4,
                    height: 2,
                    background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
                    borderRadius: 1,
                    zIndex: 3,
                  }}
                  title="Back-to-back booking — allowed"
                />
              );
            })}

            {/* Booking blocks */}
            {sorted.map((booking) => {
              const { top, height } = blockGeometry(booking.startTime, booking.endTime, rowH);
              const style = STATUS_STYLES[booking.status] ?? STATUS_STYLES.UPCOMING;
              return (
                <div
                  key={booking.id}
                  className={`booking-block-${booking.status}`}
                  title={`${booking.title} • ${fmt12(booking.startTime)} – ${fmt12(booking.endTime)}`}
                  style={{
                    position: 'absolute',
                    top: top + 1,
                    left: 4,
                    right: 4,
                    height: height - 2,
                    borderRadius: 6,
                    padding: '4px 8px',
                    overflow: 'hidden',
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    ...style,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.7)',
                        flexShrink: 0,
                      }}
                    />
                    <Text style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'inherit', opacity: 0.85 }}>
                      {STATUS_BADGE[booking.status]}
                    </Text>
                  </div>
                  {height > 32 && (
                    <Text ellipsis style={{ fontSize: 12, fontWeight: 600, color: 'inherit', lineHeight: 1.3, marginTop: 1 }}>
                      {booking.title}
                    </Text>
                  )}
                  {height > 50 && (
                    <Text style={{ fontSize: 11, color: 'inherit', opacity: 0.75, lineHeight: 1.2, marginTop: 1 }}>
                      Booked — {fmt12(booking.startTime)} to {fmt12(booking.endTime)}
                    </Text>
                  )}
                </div>
              );
            })}

            {/* Pending slot overlay */}
            {pendingSlot && (() => {
              const { top, height } = blockGeometry(pendingSlot.startTime, pendingSlot.endTime, rowH);
              return (
                <div
                  style={{
                    position: 'absolute',
                    top: top + 1,
                    left: 4,
                    right: 4,
                    height: height - 2,
                    borderRadius: 6,
                    background: pendingSlot.hasConflict
                      ? 'rgba(239,68,68,0.2)'
                      : 'rgba(16,185,129,0.18)',
                    border: `2px dashed ${pendingSlot.hasConflict ? '#ef4444' : '#10b981'}`,
                    zIndex: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: 700, color: pendingSlot.hasConflict ? '#ef4444' : '#10b981' }}>
                    {pendingSlot.hasConflict ? '⚠ Conflict detected' : '✓ Slot available'}
                  </Text>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </>
  );
}
