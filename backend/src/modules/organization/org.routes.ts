import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import * as ctrl from './org.controller';

const router = Router();
router.use(authenticate);

// Departments
router.get('/departments', ctrl.listDepartments);
router.post('/departments', ctrl.createDepartment);
router.put('/departments/:id', ctrl.updateDepartment);
router.delete('/departments/:id', ctrl.deleteDepartment);

// Categories
router.get('/categories', ctrl.listCategories);
router.post('/categories', ctrl.createCategory);
router.delete('/categories/:id', ctrl.deleteCategory);

// Facilities
router.get('/facilities', ctrl.listFacilities);
router.post('/facilities', ctrl.createFacility);
router.put('/facilities/:id', ctrl.updateFacility);
router.delete('/facilities/:id', ctrl.deleteFacility);

export default router;
