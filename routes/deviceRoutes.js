import express from 'express';
import { deviceAuth } from '../middlewares/deviceAuth.js';
import validate from '../middlewares/validate.js';
import {
  startTrigger,
  addCoordinates,
  stopTrigger
} from '../controllers/sessionController.js';
import {
  startTriggerSchema,
  addCoordinatesSchema,
  stopTriggerSchema
} from '../validations/sessionValidation.js';

const router = express.Router();

router.post('/trigger/start', deviceAuth, validate(startTriggerSchema), startTrigger);
router.post('/coordinates/add', deviceAuth, validate(addCoordinatesSchema), addCoordinates);
router.post('/trigger/stop', deviceAuth, validate(stopTriggerSchema), stopTrigger);

export default router;