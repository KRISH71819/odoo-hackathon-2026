import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import * as ctrl from './asset.controller';

const router = Router();

// ── Inline role guard — self-contained, no dependency on M1's naming ──
function authorize(...roles: string[]) {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    next();
  };
}

// All routes require authentication
router.use(authenticate);

// ── Approval routes BEFORE /:id to avoid param capture ──
router.put('/allocations/:id/approve', authorize('ADMIN', 'MANAGER'), ctrl.approveAllocation);
router.put('/allocations/:id/reject', authorize('ADMIN', 'MANAGER'), ctrl.rejectAllocation);

// ── CRUD ──
router.get('/', ctrl.listAssets);
router.post('/', authorize('ADMIN', 'MANAGER'), ctrl.createAsset);
router.get('/:id', ctrl.getAssetById);
router.put('/:id', authorize('ADMIN', 'MANAGER'), ctrl.updateAsset);
router.delete('/:id', authorize('ADMIN'), ctrl.deleteAsset);

// ── Allocation lifecycle ──
router.post('/:id/allocate', authorize('ADMIN', 'MANAGER'), ctrl.allocateAsset);
router.post('/:id/transfer', ctrl.transferAsset);
router.post('/:id/return', ctrl.returnAsset);
router.get('/:id/allocation-history', ctrl.getAllocationHistory);

export default router;
