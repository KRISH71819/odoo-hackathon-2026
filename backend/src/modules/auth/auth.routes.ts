import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import * as ctrl from './auth.controller';

const router = Router();

router.post('/signup', ctrl.signup);
router.post('/login', ctrl.login);
router.get('/me', authenticate, ctrl.getMe);
router.get('/users', authenticate, ctrl.listUsers);

export default router;
