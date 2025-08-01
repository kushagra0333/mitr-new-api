import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler } from './utils/apiError.js';
import config from './config/env.js';
import fs from 'fs/promises';
import path from 'path';

// Create app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/user', userRoutes);

// Emergency file endpoints
app.post('/api/update-emergency-data', async (req, res) => {
  try {
    const data = req.body;
    await fs.writeFile(
      path.join(__dirname, 'src/emergency.txt'),
      JSON.stringify(data, null, 2)
    );
    console.log('Updated emergency.txt:', data);
    res.json({ success: true });
  } catch (error) {
    console.error('File write error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/emergency-data', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(__dirname, 'src/emergency.txt'), 'utf8');
    res.set('Content-Type', 'text/plain');
    res.send(data);
  } catch (error) {
    console.error('File read error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
    environment: config.NODE_ENV,
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
  });
});

// Error handler
app.use(errorHandler);

// Start server
const server = app.listen(config.PORT, () => {
  console.log(`🚀 MITR SOS Backend running on port ${config.PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  server.close(() => process.exit(1));
});

// Graceful shutdown
['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => {
    console.log(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});