import Joi from 'joi';

export const linkDeviceSchema = Joi.object({
  deviceId: Joi.string().required()
});

export const updateEmergencyContactsSchema = Joi.object({
  emergencyContacts: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      phone: Joi.string().required()
    })
  ).required()
});

export const updateTriggerWordsSchema = Joi.object({
  triggerWords: Joi.array().items(Joi.string()).required()
});