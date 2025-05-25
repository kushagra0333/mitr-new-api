import express from 'express';
import {
  linkDevice,
  getMyDevices,
  getDeviceInfo,
  updateDevice,
  deleteDevice,
  triggerDevice,
  stopTrigger,
  checkDeviceStatus,
  addEmergencyContact,
  removeEmergencyContact,
  updateEmergencyContact,
  postDeviceData,
  getDeviceData
} from '../controllers/deviceController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(linkDevice)
  .get(getMyDevices);

router.route('/:deviceId')
  .get(getDeviceInfo)
  .patch(updateDevice)
  .delete(deleteDevice);

router.route('/:deviceId/trigger')
  .post(triggerDevice)
  .delete(stopTrigger);

router.get('/:deviceId/status', checkDeviceStatus);

router.route('/:deviceId/emergency-contacts')
  .post(addEmergencyContact);

router.route('/:deviceId/emergency-contacts/:contactId')
  .patch(updateEmergencyContact)
  .delete(removeEmergencyContact);

router.route('/:deviceId/data')
  .post(postDeviceData)
  .get(getDeviceData);

export default router;