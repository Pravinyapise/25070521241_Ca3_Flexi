import { Router } from 'express';
import { registerForEvent, cancelRegistration, myRegistrations } from '../controllers/registrationController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();
router.get('/mine', protect, requireRole('student'), myRegistrations);
router.post('/:eventId', protect, requireRole('student'), registerForEvent);
router.delete('/:eventId', protect, requireRole('student'), cancelRegistration);
export default router;
