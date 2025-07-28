import User from '../models/User.js';
import { verifyToken } from '../services/tokenService.js';
import ApiError from '../utils/apiError.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    const decoded = verifyToken(token);
    
    const user = await User.findOne({ 
      _id: decoded.id,
      'tokens.token': token
    });

    if (!user) {
      throw new ApiError(401, 'Invalid token');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    next(error);
  }
};