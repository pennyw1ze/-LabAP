const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/config');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'analytics-reporting-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Basic analytics endpoint
app.get('/api/analytics', (req, res) => {
  res.json({
    success: true,
    message: 'Analytics & Reporting Service is running',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: config.nodeEnv === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
function startServer() {
  app.listen(config.port, () => {
    console.log(`🚀 Analytics & Reporting Service running on port ${config.port}`);
    console.log(`❤️ Health check available at http://localhost:${config.port}/health`);
  });
}

startServer();

module.exports = app;