import express from 'express';
import { auth } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import {
  getProfile,
  changePassword,
  deleteAccount,
  linkDevice,
  getDevice,
  updateEmergencyContacts,
  updateTriggerWords
} from '../controllers/userController.js';
import {
  linkDeviceSchema,
  updateEmergencyContactsSchema,
  updateTriggerWordsSchema
} from '../validations/deviceValidation.js';

const router = express.Router();

router.get('/profile', auth, getProfile);
router.post('/change-password', auth, changePassword);
router.delete('/account', auth, deleteAccount);
router.post('/device/link', auth, validate(linkDeviceSchema), linkDevice);
router.get('/device', auth, getDevice);
router.put('/device/emergency-contacts', auth, validate(updateEmergencyContactsSchema), updateEmergencyContacts);
router.put('/device/trigger-words', auth, validate(updateTriggerWordsSchema), updateTriggerWords);

export default router;