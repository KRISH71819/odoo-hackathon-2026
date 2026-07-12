import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import * as controller from './report.controller';

const router = Router();
router.use(authenticate);
router.get('/:reportType/export', controller.exportReport);
router.get('/:reportType', controller.getReport);

export default router;
