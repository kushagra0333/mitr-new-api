import AppError from '../utils/appError.js';

const validateEnv = () => {
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'API_KEY',
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_USERNAME',
    'EMAIL_PASSWORD',
    'EMAIL_FROM',
  ];

  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      throw new AppError(`Missing required environment variable: ${envVar}`, 500);
    }
  });
};

export default validateEnv;
