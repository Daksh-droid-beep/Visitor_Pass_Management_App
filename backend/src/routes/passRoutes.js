import express from 'express';
import { generatePass, getPassById, downloadPassPDF, getAllPasses } from '../controllers/passController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// PDF download endpoint can be public to let mobile mail clients easily open it.
router.get('/download/:id', downloadPassPDF);

// Other endpoints require authentication
router.get('/', protect, authorize('ADMIN', 'SECURITY'), getAllPasses);
router.get('/all', protect, authorize('ADMIN', 'SECURITY'), getAllPasses);
router.post('/generate', protect, authorize('ADMIN', 'SECURITY', 'EMPLOYEE'), generatePass);
router.get('/:id', protect, getPassById);


export default router;
