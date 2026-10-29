import { Router } from 'express';
import { listEvents, getEvent, createEvent, updateEvent, deleteEvent } from '../controllers/eventController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();
router.get('/', listEvents);
router.get('/:id', getEvent);
router.post('/', protect, requireRole('admin'), createEvent);
router.put('/:id', protect, requireRole('admin'), updateEvent);
router.delete('/:id', protect, requireRole('admin'), deleteEvent);
export default router;
