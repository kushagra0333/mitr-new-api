import express from 'express';
import { apiKeyProtect } from '../middlewares/apiKeyMiddleware.js';
import { postDeviceData, getDeviceData } from '../controllers/dataController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Device posts location data (secured by API key)
router.post('/', apiKeyProtect, postDeviceData);

// User retrieves device location data (secured by JWT)
router.get('/:deviceId', protect, getDeviceData);

export default router;
