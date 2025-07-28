import config from '../config/env.js';
import ApiError from '../utils/apiError.js';

export const deviceAuth = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey || apiKey !== config.API_KEY) {
      throw new ApiError(401, 'Invalid API key');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};