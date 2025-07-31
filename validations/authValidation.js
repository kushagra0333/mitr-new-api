import Joi from 'joi';

export const signupInitiateSchema = Joi.object({
  userID: Joi.string().min(3).max(20).required(),
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(50).required(),
});

export const signupCompleteSchema = Joi.object({
  userID: Joi.string().min(3).max(20).required(),
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  name: Joi.string().min(2).max(50).required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
});

export const loginSchema = Joi.object({
  userID: Joi.string().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
});

export const updateUserInfoSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  userID: Joi.string().min(3).max(20).optional(),
}).or('name', 'userID');