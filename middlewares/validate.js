import ApiError from '../utils/apiError.js';

const validate = (schema) => async (req, res, next) => {
  try {
    await schema.validateAsync(req.body);
    next();
  } catch (error) {
    next(new ApiError(400, error.message));
  }
};

export default validate;