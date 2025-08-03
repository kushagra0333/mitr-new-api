import express from 'express';
import { auth } from '../middlewares/auth.js';
import { deviceAuth } from '../middlewares/deviceAuth.js';
import validate from '../middlewares/validate.js';
import {
  linkDevice,
  getDevice,
  updateEmergencyContacts,
  updateTriggerWords,
  createDevice,
  getPublicEmergencyContacts
} from '../controllers/deviceController.js';
import {
  linkDeviceSchema,
  updateEmergencyContactsSchema,
  updateTriggerWordsSchema,
  startTriggerSchema,
  addCoordinatesSchema,
  stopTriggerSchema,
  createDeviceSchema,
} from '../validations/deviceValidation.js';
import { startTrigger, addCoordinates, stopTrigger } from '../controllers/sessionController.js';

const router = express.Router();

router.post('/link', auth, validate(linkDeviceSchema), linkDevice);
router.get('/:deviceId', auth, getDevice);
router.get('/:deviceId/emergency-contacts/public', getPublicEmergencyContacts);
router.put('/:deviceId/emergency-contacts', auth, validate(updateEmergencyContactsSchema), updateEmergencyContacts);
router.put('/:deviceId/trigger-words', auth, validate(updateTriggerWordsSchema), updateTriggerWords);
router.post('/trigger/start', deviceAuth, validate(startTriggerSchema), startTrigger);
router.post('/coordinates/add', deviceAuth, validate(addCoordinatesSchema), addCoordinates);
router.post('/trigger/stop', deviceAuth, validate(stopTriggerSchema), stopTrigger);
router.post('/create', deviceAuth, validate(createDeviceSchema), createDevice);

export default router;