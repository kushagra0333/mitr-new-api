import Joi from 'joi';

export const startTriggerSchema = Joi.object({
  deviceId: Joi.string().required()
});

export const addCoordinatesSchema = Joi.object({
  deviceId: Joi.string().required(),
  lat: Joi.number().min(-90).max(90).required(),
  long: Joi.number().min(-180).max(180).required()
});

export const stopTriggerSchema = Joi.object({
  deviceId: Joi.string().required()
});