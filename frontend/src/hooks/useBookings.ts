import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BookingStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface BookingUser {
  id: string;
  name: string;
  email?: string;
}

export interface BookingAsset {
  id: string;
  name: string;
  tag: string;
  status: string;
}

export interface BookingFacility {
  id: string;
  name: string;
  type: string;
  capacity?: number;
  location?: string;
}

export interface Booking {
  id: string;
  assetId?: string;
  facilityId?: string;
  bookedById: string;
  title: string;
  purpose?: string;
  startTime: string;   // ISO datetime string from API
  endTime: string;     // ISO datetime string from API
  isRecurring: boolean;
  recurRule?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  // Expanded relations (included by the API)
  asset?: BookingAsset;
  facility?: BookingFacility;
  bookedBy?: BookingUser;
}

export interface BookingFilters {
  date?: string;         // YYYY-MM-DD
  facilityId?: string;
  assetId?: string;
  bookedById?: string;
  status?: BookingStatus;
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BookingsResponse {
  data: Booking[];
  pagination: PaginationMeta;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface AvailabilityResponse {
  resourceId: string;
  resourceType: 'asset' | 'facility';
  date: string;
  bookings: Booking[];
  availableSlots: TimeSlot[];
  workdayStart: string;
  workdayEnd: string;
}

export interface ConflictBooking {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  bookedBy: { name: string } | null;
}

export interface ConflictResponse {
  hasConflict: boolean;
  conflicts: ConflictBooking[];
}

export interface CheckConflictPayload {
  facilityId?: string;
  assetId?: string;
  startTime: string;   // ISO datetime string
  endTime: string;     // ISO datetime string
  excludeId?: string;  // Exclude a booking ID (used when updating)
}

export interface CreateBookingPayload {
  assetId?: string;
  facilityId?: string;
  title: string;
  purpose?: string;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  recurRule?: string;
}

export interface UpdateBookingPayload {
  assetId?: string;
  facilityId?: string;
  title?: string;
  purpose?: string;
  startTime?: string;
  endTime?: string;
  isRecurring?: boolean;
  recurRule?: string;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────
// Centralised constant — used for both queries AND targeted invalidations.

export const QUERY_KEYS = {
  // All bookings list; includes filters so any filter change triggers a refetch
  bookings: (filters?: BookingFilters) =>
    filters ? (['bookings', filters] as const) : (['bookings'] as const),

  // Single booking by ID
  booking: (id: string) => ['booking', id] as const,

  // Availability check for a specific resource + date
  availability: (resourceId: string, resourceType: string, date: string) =>
    ['availability', resourceId, resourceType, date] as const,
} as const;

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetch a paginated, filtered list of bookings.
 * The queryKey includes all filter values so any change triggers an automatic refetch.
 */
export function useBookings(filters: BookingFilters = {}) {
  const query = useQuery({
    queryKey: QUERY_KEYS.bookings(filters),
    queryFn: (): Promise<BookingsResponse> =>
      client
        .get('/bookings', { params: filters })
        .then((r) => ({ data: r.data.data, pagination: r.data.pagination })),
  });

  return {
    bookings: query.data?.data ?? [],
    total: query.data?.pagination.total ?? 0,
    page: query.data?.pagination.page ?? 1,
    totalPages: query.data?.pagination.totalPages ?? 1,
    loading: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Fetch a single booking by ID.
 * Query is disabled until a truthy id is provided.
 */
export function useBooking(id: string | undefined) {
  const query = useQuery({
    queryKey: QUERY_KEYS.booking(id ?? ''),
    queryFn: (): Promise<Booking> =>
      client.get(`/bookings/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  return {
    booking: query.data,
    loading: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Create a new booking.
 * Invalidates the bookings list on success so the calendar refreshes automatically.
 */
export function useCreateBooking() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBookingPayload) =>
      client.post('/bookings', data).then((r) => r.data),
    onSuccess: () => {
      // Broad invalidation — catches all filter combinations
      qc.invalidateQueries({ queryKey: QUERY_KEYS.bookings() });
    },
  });
}

/**
 * Update an existing UPCOMING booking.
 * Invalidates both the list and the individual booking cache entry.
 */
export function useUpdateBooking() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBookingPayload }) =>
      client.put(`/bookings/${id}`, data).then((r) => r.data),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.bookings() });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.booking(variables.id) });
    },
  });
}

/**
 * Cancel an UPCOMING or ONGOING booking.
 * Invalidates both the list and the individual booking entry.
 */
export function useCancelBooking() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      client.delete(`/bookings/${id}/cancel`).then((r) => r.data),
    onSuccess: (_result, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.bookings() });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.booking(id) });
    },
  });
}

/**
 * Real-time conflict check for form validation.
 *
 * Deliberately uses useMutation (not useQuery) because:
 *   - It is triggered imperatively when the user changes time fields
 *   - It must NOT pollute the global query cache
 *   - It must NOT trigger global loading indicators
 *
 * Usage: const { mutate: checkConflict, data, isPending } = useCheckConflict()
 */
export function useCheckConflict() {
  return useMutation({
    mutationFn: (payload: CheckConflictPayload): Promise<ConflictResponse> =>
      client
        .post('/bookings/check-conflict', payload)
        .then((r) => ({ hasConflict: r.data.hasConflict, conflicts: r.data.conflicts })),
    // No onSuccess invalidation — this is a pure read-only check
  });
}

/**
 * Fetch available time slots for a resource on a specific date (8:00–18:00 window).
 * Query is disabled until all three required params are provided.
 */
export function useAvailability(
  resourceId: string | undefined,
  resourceType: 'facility' | 'asset' | undefined,
  date: string | undefined
) {
  const enabled = !!resourceId && !!resourceType && !!date;

  const query = useQuery({
    queryKey: QUERY_KEYS.availability(resourceId ?? '', resourceType ?? '', date ?? ''),
    queryFn: (): Promise<AvailabilityResponse> =>
      client
        .get('/bookings/availability', {
          params: { resourceId, resourceType, date },
        })
        .then((r) => r.data),
    enabled,
    // Availability is time-sensitive; keep data fresh (30 second stale time)
    staleTime: 30 * 1000,
  });

  return {
    bookings: query.data?.bookings ?? [],
    availableSlots: query.data?.availableSlots ?? [],
    workdayStart: query.data?.workdayStart,
    workdayEnd: query.data?.workdayEnd,
    loading: query.isPending && enabled,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Manually trigger the UPCOMING→ONGOING→COMPLETED status transitions on the backend.
 * Used by an admin action or a periodic UI-side poll.
 * Does NOT invalidate cache itself — caller should call refetch after if needed.
 */
export function useTransitionStatuses() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => client.post('/bookings/transition-ongoing').then((r) => r.data),
    onSuccess: () => {
      // After transitioning statuses, any cached booking list could be stale
      qc.invalidateQueries({ queryKey: QUERY_KEYS.bookings() });
    },
  });
}
