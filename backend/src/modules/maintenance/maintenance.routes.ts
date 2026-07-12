import { NextFunction, Request, Response, Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import * as controller from './maintenance.controller';

const router = Router();

function authorize(...roles: string[]) {
  return (req: Request & { user?: { role: string } }, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    next();
  };
}

router.use(authenticate);
router.get('/', controller.listMaintenanceRequests);
router.get('/assignees', controller.listMaintenanceAssignees);
router.post('/', controller.createMaintenanceRequest);
router.put('/:id', authorize('ADMIN', 'MANAGER'), controller.updateMaintenanceRequest);
router.put('/:id/status', authorize('ADMIN', 'MANAGER'), controller.updateMaintenanceStatus);
router.put('/:id/assign', authorize('ADMIN', 'MANAGER'), controller.assignTechnician);

export default router;
