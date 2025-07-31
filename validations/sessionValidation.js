import Joi from 'joi';

const coordinateSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  accuracy: Joi.number().min(0).optional(),
  speed: Joi.number().min(0).optional()
});

export const startTriggerSchema = Joi.object({
  deviceId: Joi.string().required(),
  initialLocation: coordinateSchema.optional()
});

export const addCoordinatesSchema = Joi.object({
  deviceId: Joi.string().required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  accuracy: Joi.number().min(0).optional(),
  speed: Joi.number().min(0).optional()
});

export const stopTriggerSchema = Joi.object({
  deviceId: Joi.string().required(),
  manualStop: Joi.boolean().default(true)
});