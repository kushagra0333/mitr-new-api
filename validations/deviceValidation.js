import Joi from 'joi';

export const linkDeviceSchema = Joi.object({
  deviceId: Joi.string().required(),
  devicePassword: Joi.string().required(),
});

export const updateEmergencyContactsSchema = Joi.object({
  deviceId: Joi.string().required(),
  emergencyContacts: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        phone: Joi.string().required(),
      })
    )
    .required(),
});

export const updateTriggerWordsSchema = Joi.object({
  deviceId: Joi.string().required(),
  triggerWords: Joi.array().items(Joi.string()).required(),
});

export const startTriggerSchema = Joi.object({
  deviceId: Joi.string().required(),
  initialLocation: Joi.object({
    lat: Joi.number().min(-90).max(90),
    long: Joi.number().min(-180).max(180),
  }).optional(),
});

export const addCoordinatesSchema = Joi.object({
  deviceId: Joi.string().required(),
  lat: Joi.number().min(-90).max(90).required(),
  long: Joi.number().min(-180).max(180).required(),
});

export const stopTriggerSchema = Joi.object({
  deviceId: Joi.string().required(),
});

export const createDeviceSchema = Joi.object({
  deviceId: Joi.string().min(3).required(),
  devicePassword: Joi.string().min(6).required(),
});