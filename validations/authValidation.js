import Joi from 'joi';

// authValidation.js
export const signupInitiateSchema = Joi.object({
  userID: Joi.string().min(3).max(20).required(),
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(50).required() // Add this line
});

export const signupCompleteSchema = Joi.object({
  userID: Joi.string().min(3).max(20).required(),
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  name: Joi.string().min(2).max(50).required(), // This should already be here
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
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
  username: Joi.string().min(3).max(50).optional(),
  userID: Joi.string().min(3).max(30).optional(),
}).or('username', 'userID'); // At least one field must be provided