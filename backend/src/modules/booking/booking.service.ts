import prisma from '../../config/db';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ListBookingsFilters {
  date?: string;          // YYYY-MM-DD
  facilityId?: string;
  assetId?: string;
  bookedById?: string;
  status?: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  page?: number;
  limit?: number;
}

interface ConflictBooking {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  bookedBy: { name: string } | null;
}

// ─── Status Transition (on-access pattern) ────────────────────────────────────

/**
 * Bulk-transitions booking statuses based on current time:
 *   UPCOMING  → ONGOING    if startTime <= NOW < endTime
 *   ONGOING   → COMPLETED  if endTime   <= NOW
 *
 * Called at the start of listBookings and getBookingById so data is always fresh.
 * Also exposed as a standalone callable for the POST /transition-ongoing endpoint.
 */
export async function transitionStatuses(): Promise<void> {
  const now = new Date();

  // UPCOMING → ONGOING
  await prisma.booking.updateMany({
    where: {
      status: 'UPCOMING',
      startTime: { lte: now },
      endTime: { gt: now },
    },
    data: { status: 'ONGOING' },
  });

  // ONGOING → COMPLETED
  await prisma.booking.updateMany({
    where: {
      status: 'ONGOING',
      endTime: { lte: now },
    },
    data: { status: 'COMPLETED' },
  });
}

// ─── Conflict Detection ────────────────────────────────────────────────────────

/**
 * Detects conflicting bookings for a given resource and time range.
 *
 * Conflict condition (strict inequality intentional — allows back-to-back):
 *   startTime < requestedEnd  AND  endTime > requestedStart
 *
 * Back-to-back example:
 *   Booking A (9:00-10:00) and new booking (10:00-11:00):
 *   A.endTime (10:00) is NOT > newStart (10:00) → NO conflict ✓
 *
 * @param facilityId  - optional facility to check
 * @param assetId     - optional asset to check
 * @param startTime   - requested start (Date)
 * @param endTime     - requested end (Date)
 * @param excludeId   - optional booking ID to exclude (for updates)
 */
async function findConflicts(
  facilityId: string | undefined,
  assetId: string | undefined,
  startTime: Date,
  endTime: Date,
  excludeId?: string
): Promise<ConflictBooking[]> {
  const orConditions: object[] = [];
  if (facilityId) orConditions.push({ facilityId });
  if (assetId) orConditions.push({ assetId });

  if (orConditions.length === 0) return [];

  return prisma.booking.findMany({
    where: {
      OR: orConditions,
      status: { notIn: ['CANCELLED', 'COMPLETED'] },
      // Strict inequality — allows back-to-back bookings
      startTime: { lt: endTime },   // existing.startTime < requestedEnd
      endTime: { gt: startTime },   // existing.endTime   > requestedStart
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      bookedBy: { select: { name: true } },
    },
  });
}

// ─── Recurring: Expand Occurrences ────────────────────────────────────────────

/**
 * Expands a simple recurring rule into occurrence Date pairs for the next 4 weeks.
 * Supports: WEEKLY, BIWEEKLY (every 2 weeks).
 * For full iCal RRULE support a library like `rrule` would be used; this handles
 * the common hackathon cases cleanly.
 */
function expandRecurrences(
  startTime: Date,
  endTime: Date,
  recurRule: string
): Array<{ startTime: Date; endTime: Date }> {
  const occurrences: Array<{ startTime: Date; endTime: Date }> = [];
  const durationMs = endTime.getTime() - startTime.getTime();
  const upperLimit = new Date(startTime.getTime() + 28 * 24 * 60 * 60 * 1000); // 4 weeks

  const ruleUpper = recurRule.toUpperCase();
  let intervalDays = 7; // default WEEKLY

  if (ruleUpper.includes('BIWEEKLY') || ruleUpper.includes('FREQ=WEEKLY;INTERVAL=2')) {
    intervalDays = 14;
  } else if (ruleUpper.includes('DAILY') || ruleUpper.includes('FREQ=DAILY')) {
    intervalDays = 1;
  }

  let cursor = new Date(startTime);
  // Start from the NEXT occurrence (the first booking is the base, created directly)
  cursor.setDate(cursor.getDate() + intervalDays);

  while (cursor <= upperLimit) {
    occurrences.push({
      startTime: new Date(cursor),
      endTime: new Date(cursor.getTime() + durationMs),
    });
    cursor = new Date(cursor.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  }

  return occurrences;
}

// ─── Service Functions ─────────────────────────────────────────────────────────

/** List bookings with optional filters and pagination */
export async function listBookings(filters: ListBookingsFilters) {
  // Always run status transitions before returning data
  await transitionStatuses();

  const {
    date,
    facilityId,
    assetId,
    bookedById,
    status,
    page = 1,
    limit = 20,
  } = filters;

  const where: Record<string, unknown> = {};

  if (facilityId) where.facilityId = facilityId;
  if (assetId) where.assetId = assetId;
  if (bookedById) where.bookedById = bookedById;
  if (status) where.status = status;

  if (date) {
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);
    where.startTime = { gte: dayStart, lte: dayEnd };
  }

  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        facility: true,
        asset: true,
        bookedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startTime: 'asc' },
      skip,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    data: bookings,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/** Get a single booking by ID with all relations */
export async function getBookingById(id: string) {
  // Always run status transitions before returning data
  await transitionStatuses();

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      facility: true,
      asset: true,
      bookedBy: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  if (!booking) {
    const err = new Error('Booking not found') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  return booking;
}

/** Create a new booking with full conflict and resource validation */
export async function createBooking(
  data: {
    assetId?: string;
    facilityId?: string;
    bookedById: string;
    title: string;
    purpose?: string;
    startTime: string;
    endTime: string;
    isRecurring?: boolean;
    recurRule?: string;
  }
) {
  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);
  const now = new Date();

  // ── Reject past-date bookings ──────────────────────────────────────────────
  if (startTime < now) {
    const err = new Error('Cannot create a booking in the past') as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  // ── Reject UNDER_MAINTENANCE resources ─────────────────────────────────────
  if (data.assetId) {
    const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
    if (!asset) {
      const err = new Error('Asset not found') as Error & { statusCode: number };
      err.statusCode = 404;
      throw err;
    }
    if (asset.status === 'UNDER_MAINTENANCE') {
      const err = new Error(`Asset "${asset.name}" is currently UNDER_MAINTENANCE and cannot be booked`) as Error & { statusCode: number; code: string };
      err.statusCode = 409;
      err.code = 'RESOURCE_UNDER_MAINTENANCE';
      throw err;
    }
  }

  // ── Conflict check for the primary booking ─────────────────────────────────
  const conflicts = await findConflicts(data.facilityId, data.assetId, startTime, endTime);

  if (conflicts.length > 0) {
    const err = new Error('Booking conflict') as Error & {
      statusCode: number;
      conflicts: ConflictBooking[];
    };
    err.statusCode = 409;
    err.conflicts = conflicts;
    throw err;
  }

  // ── Recurring: check ALL occurrences before creating anything ──────────────
  if (data.isRecurring && data.recurRule) {
    const occurrences = expandRecurrences(startTime, endTime, data.recurRule);

    for (const occurrence of occurrences) {
      const occurrenceConflicts = await findConflicts(
        data.facilityId,
        data.assetId,
        occurrence.startTime,
        occurrence.endTime
      );

      if (occurrenceConflicts.length > 0) {
        const err = new Error('Recurring booking conflict: one or more occurrences overlap with existing bookings') as Error & {
          statusCode: number;
          conflicts: ConflictBooking[];
        };
        err.statusCode = 409;
        err.conflicts = occurrenceConflicts;
        throw err;
      }
    }

    // All clear — create all recurring occurrences + the original
    const allBookingsData = [
      {
        assetId: data.assetId,
        facilityId: data.facilityId,
        bookedById: data.bookedById,
        title: data.title,
        purpose: data.purpose,
        startTime,
        endTime,
        isRecurring: true,
        recurRule: data.recurRule,
        status: 'UPCOMING' as const,
      },
      ...expandRecurrences(startTime, endTime, data.recurRule).map((occ) => ({
        assetId: data.assetId,
        facilityId: data.facilityId,
        bookedById: data.bookedById,
        title: data.title,
        purpose: data.purpose,
        startTime: occ.startTime,
        endTime: occ.endTime,
        isRecurring: true,
        recurRule: data.recurRule,
        status: 'UPCOMING' as const,
      })),
    ];

    // Use a transaction to create all occurrences atomically
    const created = await prisma.$transaction(
      allBookingsData.map((b) => prisma.booking.create({ data: b }))
    );

    return { booking: created[0], recurringCount: created.length };
  }

  // ── Non-recurring single booking ──────────────────────────────────────────
  const booking = await prisma.booking.create({
    data: {
      assetId: data.assetId,
      facilityId: data.facilityId,
      bookedById: data.bookedById,
      title: data.title,
      purpose: data.purpose,
      startTime,
      endTime,
      isRecurring: data.isRecurring ?? false,
      recurRule: data.recurRule,
      status: 'UPCOMING',
    },
    include: {
      facility: true,
      asset: true,
      bookedBy: { select: { id: true, name: true } },
    },
  });

  // Optionally mark asset as RESERVED when it's booked
  if (data.assetId) {
    await prisma.asset.update({
      where: { id: data.assetId },
      data: { status: 'RESERVED' },
    });
  }

  return { booking, recurringCount: 1 };
}

/** Update an UPCOMING booking. Re-runs conflict check if times change. */
export async function updateBooking(
  id: string,
  data: {
    assetId?: string;
    facilityId?: string;
    title?: string;
    purpose?: string;
    startTime?: string;
    endTime?: string;
    isRecurring?: boolean;
    recurRule?: string;
  }
) {
  const existing = await prisma.booking.findUnique({ where: { id } });

  if (!existing) {
    const err = new Error('Booking not found') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  if (existing.status !== 'UPCOMING') {
    const err = new Error(`Only UPCOMING bookings can be updated. Current status: ${existing.status}`) as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  // ── If time changes, re-run conflict check ────────────────────────────────
  const timeChanged = data.startTime || data.endTime;

  if (timeChanged) {
    const newStart = data.startTime ? new Date(data.startTime) : existing.startTime;
    const newEnd = data.endTime ? new Date(data.endTime) : existing.endTime;
    const now = new Date();

    if (newStart < now) {
      const err = new Error('Cannot reschedule a booking to a past time') as Error & { statusCode: number };
      err.statusCode = 400;
      throw err;
    }

    const facilityId = data.facilityId ?? existing.facilityId ?? undefined;
    const assetId = data.assetId ?? existing.assetId ?? undefined;
    const conflicts = await findConflicts(facilityId, assetId, newStart, newEnd, id);

    if (conflicts.length > 0) {
      const err = new Error('Booking conflict') as Error & {
        statusCode: number;
        conflicts: ConflictBooking[];
      };
      err.statusCode = 409;
      err.conflicts = conflicts;
      throw err;
    }
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      ...(data.assetId !== undefined && { assetId: data.assetId }),
      ...(data.facilityId !== undefined && { facilityId: data.facilityId }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.purpose !== undefined && { purpose: data.purpose }),
      ...(data.startTime !== undefined && { startTime: new Date(data.startTime) }),
      ...(data.endTime !== undefined && { endTime: new Date(data.endTime) }),
      ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
      ...(data.recurRule !== undefined && { recurRule: data.recurRule }),
    },
    include: {
      facility: true,
      asset: true,
      bookedBy: { select: { id: true, name: true } },
    },
  });

  return updated;
}

/** Cancel an UPCOMING or ONGOING booking */
export async function cancelBooking(id: string) {
  const existing = await prisma.booking.findUnique({ where: { id } });

  if (!existing) {
    const err = new Error('Booking not found') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  if (!['UPCOMING', 'ONGOING'].includes(existing.status)) {
    const err = new Error(`Cannot cancel a booking with status: ${existing.status}`) as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  const cancelled = await prisma.booking.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: {
      facility: true,
      asset: true,
      bookedBy: { select: { id: true, name: true } },
    },
  });

  // If an asset was reserved for this booking, free it back to AVAILABLE
  if (cancelled.assetId) {
    const activeBookings = await prisma.booking.count({
      where: {
        assetId: cancelled.assetId,
        status: { in: ['UPCOMING', 'ONGOING'] },
        id: { not: id },
      },
    });
    if (activeBookings === 0) {
      await prisma.asset.update({
        where: { id: cancelled.assetId },
        data: { status: 'AVAILABLE' },
      });
    }
  }

  return cancelled;
}

/** Check availability for a resource on a given date (8:00–18:00 window) */
export async function checkAvailability(
  resourceId: string,
  resourceType: 'asset' | 'facility',
  date: string
) {
  await transitionStatuses();

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const where =
    resourceType === 'facility'
      ? { facilityId: resourceId }
      : { assetId: resourceId };

  const bookings = await prisma.booking.findMany({
    where: {
      ...where,
      status: { notIn: ['CANCELLED'] },
      startTime: { gte: dayStart },
      endTime: { lte: dayEnd },
    },
    include: {
      bookedBy: { select: { id: true, name: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  // Calculate available slots within 8:00–18:00 work hours
  const workdayStart = new Date(`${date}T08:00:00.000Z`);
  const workdayEnd = new Date(`${date}T18:00:00.000Z`);

  const availableSlots: Array<{ startTime: Date; endTime: Date }> = [];
  let cursor = workdayStart;

  for (const booking of bookings) {
    const bookingStart = booking.startTime < workdayStart ? workdayStart : booking.startTime;
    const bookingEnd = booking.endTime > workdayEnd ? workdayEnd : booking.endTime;

    if (cursor < bookingStart) {
      availableSlots.push({ startTime: new Date(cursor), endTime: new Date(bookingStart) });
    }
    if (bookingEnd > cursor) {
      cursor = bookingEnd;
    }
  }

  // Remaining time after all bookings
  if (cursor < workdayEnd) {
    availableSlots.push({ startTime: new Date(cursor), endTime: new Date(workdayEnd) });
  }

  return {
    resourceId,
    resourceType,
    date,
    bookings,
    availableSlots,
    workdayStart,
    workdayEnd,
  };
}

/** Standalone conflict check for real-time frontend validation */
export async function checkConflict(params: {
  facilityId?: string;
  assetId?: string;
  startTime: string;
  endTime: string;
  excludeId?: string;
}): Promise<{ hasConflict: boolean; conflicts: ConflictBooking[] }> {
  const { facilityId, assetId, startTime, endTime, excludeId } = params;

  const conflicts = await findConflicts(
    facilityId,
    assetId,
    new Date(startTime),
    new Date(endTime),
    excludeId
  );

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}
