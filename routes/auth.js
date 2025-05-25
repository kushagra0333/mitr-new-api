import express from 'express';
import {
  signup,
  login,
  protect,
  forgotPassword,
  resetPassword,
  updatePassword,
  toggleOtp
} from '../controllers/authController.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Public routes
router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);

// Protected routes
router.use(protect);

router.patch('/update-password', updatePassword);
router.patch('/toggle-otp', toggleOtp);

export default router;