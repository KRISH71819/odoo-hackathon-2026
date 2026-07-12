import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import {
  listBookingsController,
  createBookingController,
  checkAvailabilityController,
  checkConflictController,
  transitionStatusesController,
  getBookingByIdController,
  updateBookingController,
  cancelBookingController,
} from './booking.controller';

const router = Router();

// ─── All booking routes are protected ─────────────────────────────────────────
// NOTE: Static routes (/availability, /check-conflict, /transition-ongoing)
// MUST be declared BEFORE the dynamic /:id route to avoid Express matching
// "availability" as an :id parameter.

// GET    /api/bookings               → list bookings with filters & pagination
router.get('/', authenticate, listBookingsController);

// POST   /api/bookings               → create a new booking
router.post('/', authenticate, createBookingController);

// GET    /api/bookings/availability  → get available time slots for a resource
router.get('/availability', authenticate, checkAvailabilityController);

// POST   /api/bookings/check-conflict → real-time conflict check (frontend validation)
router.post('/check-conflict', authenticate, checkConflictController);

// POST   /api/bookings/transition-ongoing → manually trigger status transitions
router.post('/transition-ongoing', authenticate, transitionStatusesController);

// GET    /api/bookings/:id           → get single booking by ID
router.get('/:id', authenticate, getBookingByIdController);

// PUT    /api/bookings/:id           → update an UPCOMING booking
router.put('/:id', authenticate, updateBookingController);

// DELETE /api/bookings/:id/cancel    → cancel an UPCOMING or ONGOING booking
router.delete('/:id/cancel', authenticate, cancelBookingController);

export default router;
