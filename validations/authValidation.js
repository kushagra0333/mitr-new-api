import Joi from 'joi';

export const signupInitiateSchema = Joi.object({
  userID: Joi.string().min(3).max(20).required(),
  email: Joi.string().email().required()
});

export const signupCompleteSchema = Joi.object({
  userID: Joi.string().min(3).max(20).required(),
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  password: Joi.string().min(6).required()
});

export const loginSchema = Joi.object({
  userID: Joi.string().required(),
  password: Joi.string().required()
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).required()
});