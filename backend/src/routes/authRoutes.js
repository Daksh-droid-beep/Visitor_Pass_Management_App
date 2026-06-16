import express from 'express';
import { register, login, sendOTP, verifyOTP, getProfile, getEmployees, getUsers, deleteUser, updateUser, resetPassword } from '../controllers/authController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { upload } from '../config/multer.js';

const router = express.Router();

router.post('/register', upload.single('profilePhoto'), register);
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.get('/profile', protect, getProfile);
router.get('/employees', protect, getEmployees);
router.get('/users', protect, authorize('ADMIN'), getUsers);
router.put('/users/:id', protect, authorize('ADMIN'), updateUser);
router.put('/users/:id/reset-password', protect, authorize('ADMIN'), resetPassword);
router.delete('/users/:id', protect, authorize('ADMIN'), deleteUser);




export default router;
