import express from 'express';
import { createAppointment, getAppointments, approveAppointment, rejectAppointment } from '../controllers/appointmentController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect); // All routes require JWT authentication

router.post('/', createAppointment);
router.get('/', getAppointments);
router.put('/:id/approve', authorize('EMPLOYEE', 'ADMIN'), approveAppointment);
router.put('/:id/reject', authorize('EMPLOYEE', 'ADMIN'), rejectAppointment);

export default router;
