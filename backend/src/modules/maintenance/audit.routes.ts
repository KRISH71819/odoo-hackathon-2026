import { NextFunction, Request, Response, Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import * as controller from './audit.controller';

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
router.get('/', controller.listAudits);
router.post('/', authorize('ADMIN', 'MANAGER'), controller.createAudit);
router.get('/:id', controller.getAuditById);
router.put('/:auditId/items/:itemId', authorize('ADMIN', 'MANAGER'), controller.updateAuditItem);
router.post('/:id/generate-report', authorize('ADMIN', 'MANAGER'), controller.generateReport);

export default router;
