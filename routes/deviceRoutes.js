import express from 'express';
import { auth } from '../middlewares/auth.js';
import { deviceAuth } from '../middlewares/deviceAuth.js';
import validate from '../middlewares/validate.js';
import {
  linkDevice,
  getDevice,
  updateEmergencyContacts,
  updateTriggerWords
} from '../controllers/deviceController.js';
import {
  startTrigger,
  addCoordinates,
  stopTrigger
} from '../controllers/sessionController.js';
import {
  linkDeviceSchema,
  updateEmergencyContactsSchema,
  updateTriggerWordsSchema,
  startTriggerSchema,
  addCoordinatesSchema,
  stopTriggerSchema
} from '../validations/deviceValidation.js';

const router = express.Router();

router.post('/link', auth, validate(linkDeviceSchema), linkDevice);
router.get('/:deviceId', auth, getDevice);
router.put('/emergency-contacts', auth, validate(updateEmergencyContactsSchema), updateEmergencyContacts);
router.put('/trigger-words', auth, validate(updateTriggerWordsSchema), updateTriggerWords);
router.post('/trigger/start', deviceAuth, validate(startTriggerSchema), startTrigger);
router.post('/coordinates/add', deviceAuth, validate(addCoordinatesSchema), addCoordinates);
router.post('/trigger/stop', deviceAuth, validate(stopTriggerSchema), stopTrigger);

export default router;