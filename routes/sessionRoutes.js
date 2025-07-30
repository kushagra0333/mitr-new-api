import express from 'express';
import { auth } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import {
  getSessionHistory,
  getSessionDetails,
  stopTrigger,
  getCurrentLocation
} from '../controllers/sessionController.js';
import { stopTriggerSchema } from '../validations/sessionValidation.js';

const router = express.Router();

router.get('/history', auth, getSessionHistory);
router.get('/:sessionId', auth, getSessionDetails);
router.post('/stop', auth, validate(stopTriggerSchema), stopTrigger);
router.get('/current-location/:deviceId', auth, getCurrentLocation);

export default router;