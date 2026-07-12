import { Request, Response, NextFunction } from 'express';
import {
  listBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
  checkAvailability,
  checkConflict,
  transitionStatuses,
} from './booking.service';
import {
  createBookingSchema,
  updateBookingSchema,
  checkConflictSchema,
  availabilityQuerySchema,
} from './booking.validators';

// ─── Helper: extract numeric query param with default ─────────────────────────
function parseIntParam(val: unknown, fallback: number): number {
  const n = parseInt(String(val), 10);
  return isNaN(n) ? fallback : n;
}

// ─── Helper: map service errors to HTTP responses ─────────────────────────────
function handleError(err: unknown, res: Response): void {
  const e = err as Error & {
    statusCode?: number;
    conflicts?: object[];
    code?: string;
  };

  const status = e.statusCode ?? 500;

  if (e.conflicts) {
    res.status(status).json({
      success: false,
      error: e.message,
      conflicts: e.conflicts,
    });
    return;
  }

  res.status(status).json({
    success: false,
    error: e.message ?? 'Internal server error',
    ...(e.code ? { code: e.code } : {}),
  });
}

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/bookings
 * Query params: date, facilityId, assetId, bookedById, status, page, limit
 */
export async function listBookingsController(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const result = await listBookings({
      date: req.query.date as string | undefined,
      facilityId: req.query.facilityId as string | undefined,
      assetId: req.query.assetId as string | undefined,
      bookedById: req.query.bookedById as string | undefined,
      status: req.query.status as 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | undefined,
      page: parseIntParam(req.query.page, 1),
      limit: parseIntParam(req.query.limit, 20),
    });

    res.json({ success: true, ...result });
  } catch (err) {
    handleError(err, res);
  }
}

/**
 * POST /api/bookings
 * Body: CreateBookingInput
 */
export async function createBookingController(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: parsed.error.flatten(),
      });
      return;
    }

    // bookedById is injected by the auth middleware into req.user
    const bookedById = (req as Request & { user?: { userId: string } }).user?.userId;
    if (!bookedById) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const result = await createBooking({ ...parsed.data, bookedById });
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    handleError(err, res);
  }
}

/**
 * GET /api/bookings/availability
 * Query params: resourceId, resourceType, date
 */
export async function checkAvailabilityController(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const parsed = availabilityQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: parsed.error.flatten(),
      });
      return;
    }

    const { resourceId, resourceType, date } = parsed.data;
    const result = await checkAvailability(resourceId, resourceType, date);
    res.json({ success: true, ...result });
  } catch (err) {
    handleError(err, res);
  }
}

/**
 * POST /api/bookings/check-conflict
 * Body: { facilityId?, assetId?, startTime, endTime, excludeId? }
 */
export async function checkConflictController(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const parsed = checkConflictSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: parsed.error.flatten(),
      });
      return;
    }

    const result = await checkConflict({
      ...parsed.data,
      excludeId: req.body.excludeId as string | undefined,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    handleError(err, res);
  }
}

/**
 * POST /api/bookings/transition-ongoing
 * Manually trigger status transitions (can also be called by a cron job)
 */
export async function transitionStatusesController(
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    await transitionStatuses();
    res.json({ success: true, message: 'Status transitions applied successfully' });
  } catch (err) {
    handleError(err, res);
  }
}

/**
 * GET /api/bookings/:id
 */
export async function getBookingByIdController(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const booking = await getBookingById(req.params.id);
    res.json({ success: true, data: booking });
  } catch (err) {
    handleError(err, res);
  }
}

/**
 * PUT /api/bookings/:id
 * Body: UpdateBookingInput (partial)
 */
export async function updateBookingController(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const parsed = updateBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: parsed.error.flatten(),
      });
      return;
    }

    const updated = await updateBooking(req.params.id, parsed.data);
    res.json({ success: true, data: updated });
  } catch (err) {
    handleError(err, res);
  }
}

/**
 * DELETE /api/bookings/:id/cancel
 */
export async function cancelBookingController(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  try {
    const cancelled = await cancelBooking(req.params.id);
    res.json({ success: true, data: cancelled });
  } catch (err) {
    handleError(err, res);
  }
}
