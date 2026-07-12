import React, { useMemo } from 'react';
import { Spin, Alert, Typography } from 'antd';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useAvailability } from '../../hooks/useBookings';
import type { Booking, BookingStatus } from '../../hooks/useBookings';

const { Text } = Typography;

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUR_START = 8;        // 8:00 AM
const HOUR_END = 18;         // 6:00 PM
const TOTAL_HOURS = HOUR_END - HOUR_START; // 10
const ROW_HEIGHT = 60;       // px per hour (desktop)
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
    // pulse animation applied via className
  },
  COMPLETED: {
    background: 'rgba(140, 140, 140, 0.55)',
    border: '1px solid #52525b',
    color: '#a1a1aa',
  },
  CANCELLED: {
    background: `repeating-linear-gradient(
      -45deg,
      rgba(239,68,68,0.08) 0px,
      rgba(239,68,68,0.08) 6px,
      rgba(0,0,0,0) 6px,
      rgba(0,0,0,0) 12px
    )`,
    border: '1px solid rgba(239,68,68,0.25)',
    color: '#71717a',
    opacity: 0.6,
  },
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  UPCOMING: 'Upcoming',
  ONGOING: 'Live',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a Date/ISO string to minutes-since-midnight */
function toMinutes(iso: string): number {
  const d = dayjs(iso);
  return d.hour() * 60 + d.minute();
}

/** Format ISO string to 12-hour time e.g. "2:30 PM" */
function fmt12(iso: string): string {
  return dayjs(iso).format('h:mm A');
}

/** Format hour number to 12-hour label e.g. 13 → "1:00 PM" */
function hourLabel(h: number): string {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00 ${suffix}`;
}

/** Compute top offset and height in pixels for a booking block */
function blockGeometry(
  startIso: string,
  endIso: string,
  rowHeight: number
): { top: number; height: number } {
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

// ─── Back-to-back detector ───────────────────────────────────────────────────

function isBackToBack(a: Booking, b: Booking): boolean {
  return a.endTime === b.startTime || dayjs(a.endTime).isSame(dayjs(b.startTime));
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

  // Sort bookings by startTime
  const sorted = useMemo(
    () => [...bookings].sort((a, b) => dayjs(a.startTime).diff(dayjs(b.startTime))),
    [bookings]
  );

  // Detect mobile via CSS media — use a simple window width check
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const rowH = isMobile ? ROW_HEIGHT_MOBILE : ROW_HEIGHT;
  const totalHeight = TOTAL_HOURS * rowH;
  const timelineWidth = isMobile ? '100%' : 'calc(100% - 80px)';

  // ── Loading ──────────────────────────────────────────────────────────────
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

  // ── Error ────────────────────────────────────────────────────────────────
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
      {/* ── Keyframe style injected once ─────────────────────────────────── */}
      <style>{`
        @keyframes booking-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
          70%  { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
        .booking-block-ONGOING {
          animation: booking-pulse 2s ease-in-out infinite;
        }
        @media (max-width: 639px) {
          .booking-timeline-wrapper {
            flex-direction: column !important;
          }
          .booking-hour-col {
            flex-direction: row !important;
            width: 100% !important;
            height: auto !important;
          }
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
        <div
          className="booking-timeline-wrapper"
          style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}
        >
          {/* ── Hour labels column ──────────────────────────────────────── */}
          <div
            className="booking-hour-col"
            style={{
              width: isMobile ? '100%' : 72,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              height: isMobile ? 'auto' : totalHeight,
            }}
          >
            {HOURS.map((h, i) => (
              <div
                key={h}
                style={{
                  position: isMobile ? 'relative' : 'absolute',
                  top: isMobile ? undefined : i * rowH,
                  height: isMobile ? rowH : undefined,
                  display: 'flex',
                  alignItems: 'flex-start',
                  paddingTop: 2,
                  width: '100%',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: h === HOUR_START ? 'var(--text-secondary)' : 'var(--text-muted)',
                    fontVariantNumeric: 'tabular-nums',
                    whiteSpace: 'nowrap',
                    lineHeight: 1,
                  }}
                >
                  {hourLabel(h)}
                </Text>
              </div>
            ))}
          </div>

          {/* ── Timeline body ───────────────────────────────────────────── */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              height: totalHeight,
              width: timelineWidth,
            }}
          >
            {/* Hour grid lines */}
            {HOURS.map((h, i) => (
              <div
                key={`grid-${h}`}
                style={{
                  position: 'absolute',
                  top: i * rowH,
                  left: 0,
                  right: 0,
                  height: 1,
                  background:
                    h === HOUR_START
                      ? 'var(--border-strong)'
                      : 'var(--border-subtle)',
                  opacity: h === HOUR_START ? 1 : 0.5,
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
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 8,
                  pointerEvents: 'none',
                }}
              >
                <Text style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  No bookings for this date
                </Text>
                <Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  All slots are available from 8:00 AM to 6:00 PM
                </Text>
              </div>
            )}

            {/* Back-to-back dividers — rendered before blocks so blocks are on top */}
            {sorted.map((booking, idx) => {
              if (idx === 0) return null;
              const prev = sorted[idx - 1];
              if (!isBackToBack(prev, booking)) return null;
              const dividerTop = blockGeometry(booking.startTime, booking.endTime, rowH).top;
              return (
                <div
                  key={`btb-${booking.id}`}
                  style={{
                    position: 'absolute',
                    top: dividerTop,
                    left: 4,
                    right: 4,
                    height: 2,
                    background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
                    borderRadius: 1,
                    zIndex: 3,
                  }}
                  title="Back-to-back booking — both are allowed"
                />
              );
            })}

            {/* Booking blocks */}
            {sorted.map((booking) => {
              const { top, height } = blockGeometry(booking.startTime, booking.endTime, rowH);
              const statusStyle = STATUS_STYLES[booking.status] ?? STATUS_STYLES.UPCOMING;

              return (
                <div
                  key={booking.id}
                  className={`booking-block-${booking.status}`}
                  title={`${booking.title}\n${fmt12(booking.startTime)} – ${fmt12(booking.endTime)}\nBooked by: ${booking.bookedBy?.name ?? 'Unknown'}`}
                  style={{
                    position: 'absolute',
                    top: top + 1,
                    left: 4,
                    right: 4,
                    height: height - 2,
                    borderRadius: 6,
                    padding: '4px 8px',
                    overflow: 'hidden',
                    cursor: 'default',
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    transition: 'filter 0.15s ease',
                    ...statusStyle,
                  }}
                >
                  {/* Status dot + label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background:
                          booking.status === 'ONGOING'
                            ? '#fff'
                            : booking.status === 'COMPLETED'
                            ? '#71717a'
                            : 'rgba(255,255,255,0.7)',
                        flexShrink: 0,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'inherit',
                        opacity: 0.8,
                      }}
                    >
                      {STATUS_LABEL[booking.status]}
                    </Text>
                  </div>

                  {height > 32 && (
                    <Text
                      ellipsis
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'inherit',
                        lineHeight: 1.3,
                        marginTop: 1,
                      }}
                    >
                      {booking.title}
                    </Text>
                  )}

                  {height > 50 && (
                    <Text
                      style={{
                        fontSize: 11,
                        color: 'inherit',
                        opacity: 0.75,
                        lineHeight: 1.2,
                        marginTop: 2,
                      }}
                    >
                      {fmt12(booking.startTime)} – {fmt12(booking.endTime)}
                    </Text>
                  )}
                </div>
              );
            })}

            {/* ── Pending slot overlay (conflict preview from form) ─────── */}
            {pendingSlot && (() => {
              const { top, height } = blockGeometry(
                pendingSlot.startTime,
                pendingSlot.endTime,
                rowH
              );
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
                      ? 'rgba(239,68,68,0.25)'
                      : 'rgba(16,185,129,0.2)',
                    border: `2px dashed ${pendingSlot.hasConflict ? '#ef4444' : '#10b981'}`,
                    zIndex: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: pendingSlot.hasConflict ? '#ef4444' : '#10b981',
                    }}
                  >
                    {pendingSlot.hasConflict
                      ? '⚠ Conflict detected'
                      : '✓ Slot available'}
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
