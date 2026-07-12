import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import * as controller from './dashboard.controller';

const router = Router();
router.use(authenticate);
router.get('/overview', controller.getOverview);
router.get('/recent-activity', controller.getRecentActivity);

export default router;
