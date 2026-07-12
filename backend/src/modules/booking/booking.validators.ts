import { z } from 'zod';

// ─── Create Booking Schema ────────────────────────────────────────────────────

export const createBookingSchema = z
  .object({
    assetId: z.string().uuid('assetId must be a valid UUID').optional(),
    facilityId: z.string().uuid('facilityId must be a valid UUID').optional(),

    title: z.string().min(2, 'Title must be at least 2 characters'),
    purpose: z.string().optional(),

    startTime: z.string().datetime({ message: 'startTime must be a valid ISO datetime' }),
    endTime: z.string().datetime({ message: 'endTime must be a valid ISO datetime' }),

    isRecurring: z.boolean().default(false),
    recurRule: z.string().optional(),
  })
  // At least one of assetId or facilityId must be provided
  .refine((data) => data.assetId !== undefined || data.facilityId !== undefined, {
    message: 'At least one of assetId or facilityId must be provided',
    path: ['assetId'],
  })
  // endTime must be strictly after startTime
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  })
  // recurRule is required when isRecurring is true
  .refine((data) => !data.isRecurring || (data.recurRule && data.recurRule.trim().length > 0), {
    message: 'recurRule is required when isRecurring is true',
    path: ['recurRule'],
  });

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// ─── Update Booking Schema ─────────────────────────────────────────────────────

export const updateBookingSchema = z
  .object({
    assetId: z.string().uuid('assetId must be a valid UUID').optional(),
    facilityId: z.string().uuid('facilityId must be a valid UUID').optional(),

    title: z.string().min(2, 'Title must be at least 2 characters').optional(),
    purpose: z.string().optional(),

    startTime: z.string().datetime({ message: 'startTime must be a valid ISO datetime' }).optional(),
    endTime: z.string().datetime({ message: 'endTime must be a valid ISO datetime' }).optional(),

    isRecurring: z.boolean().optional(),
    recurRule: z.string().optional(),
  })
  // Only validate time range if BOTH times are provided
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return new Date(data.endTime) > new Date(data.startTime);
      }
      return true;
    },
    {
      message: 'endTime must be after startTime',
      path: ['endTime'],
    }
  );

export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;

// ─── Check Conflict Schema ─────────────────────────────────────────────────────

export const checkConflictSchema = z
  .object({
    assetId: z.string().uuid().optional(),
    facilityId: z.string().uuid().optional(),
    startTime: z.string().datetime({ message: 'startTime must be a valid ISO datetime' }),
    endTime: z.string().datetime({ message: 'endTime must be a valid ISO datetime' }),
  })
  .refine((data) => data.assetId !== undefined || data.facilityId !== undefined, {
    message: 'At least one of assetId or facilityId must be provided',
    path: ['assetId'],
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  });

export type CheckConflictInput = z.infer<typeof checkConflictSchema>;

// ─── Availability Query Schema ─────────────────────────────────────────────────

export const availabilityQuerySchema = z.object({
  resourceId: z.string().uuid('resourceId must be a valid UUID'),
  resourceType: z.enum(['asset', 'facility'], {
    errorMap: () => ({ message: 'resourceType must be "asset" or "facility"' }),
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
});

export type AvailabilityQueryInput = z.infer<typeof availabilityQuerySchema>;
