import express from 'express';
import { auth } from '../middlewares/auth.js';
import { deviceAuth } from '../middlewares/deviceAuth.js';
import validate from '../middlewares/validate.js';
import {
  startTrigger,
  addCoordinates,
  stopTrigger,
  getSessionHistory,
  getSessionDetails,
  getActiveSessions,
  getSessionStatus
} from '../controllers/sessionController.js';
import {
  startTriggerSchema,
  addCoordinatesSchema,
  stopTriggerSchema
} from '../validations/sessionValidation.js';

const router = express.Router();

// Device-initiated endpoints
router.post('/start', deviceAuth, validate(startTriggerSchema), startTrigger);
router.post('/coordinates', deviceAuth, validate(addCoordinatesSchema), addCoordinates);
router.post('/stop', deviceAuth, validate(stopTriggerSchema), stopTrigger);

// User endpoints
router.get('/history', auth, getSessionHistory);
router.get('/active', auth, getActiveSessions);
router.get('/:sessionId', auth, getSessionDetails);
router.get('/status/:deviceId', auth, getSessionStatus);

export default router;