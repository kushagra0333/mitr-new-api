import express from 'express';
import { auth } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import {
  signupInitiate,
  signupComplete,
  login,
  forgotPassword,
  resetPassword,
  logout,
  logoutAll,
  updateUserInfo,
} from '../controllers/authController.js';
import {
  signupInitiateSchema,
  signupCompleteSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateUserInfoSchema,
} from '../validations/authValidation.js';

const router = express.Router();

router.post('/signup/initiate', validate(signupInitiateSchema), signupInitiate);
router.post('/signup/complete', validate(signupCompleteSchema), signupComplete);
router.post('/login', validate(loginSchema), login);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/logout', auth, logout);
router.post('/logout-all', auth, logoutAll);
router.put('/user/update', auth, validate(updateUserInfoSchema), updateUserInfo);

export default router;