import { Router } from 'express';
import { analytics, listAllRegistrations, exportRegistrations } from '../controllers/adminController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(protect, requireRole('admin'));
router.get('/analytics', analytics);
router.get('/registrations', listAllRegistrations);
router.get('/registrations.csv', exportRegistrations);
export default router;
