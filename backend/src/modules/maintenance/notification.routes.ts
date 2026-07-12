import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import * as controller from './notification.controller';

const router = Router();
router.use(authenticate);

router.get('/', controller.listNotifications);
router.put('/read-all', controller.markAllAsRead);
router.put('/:id/read', controller.markAsRead);

export default router;
