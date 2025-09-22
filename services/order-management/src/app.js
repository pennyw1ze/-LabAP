const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const config = require('./config/config');
const { sequelize } = require('./models');
const orderRoutes = require('./routes/orderRoutes');
const messageQueueService = require('./services/messageQueueService');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ByteRisto Order Management Service API',
      version: '1.0.0',
      description: 'Restaurant management system - Order Management microservice',
      contact: {
        name: 'ByteRisto Team',
        email: 'support@byteristo.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server'
      }
    ],
    tags: [
      {
        name: 'Orders',
        description: 'Order management operations'
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'order-management-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/orders', orderRoutes);

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

// Database connection and server startup
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync database models
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized.');

    // Connect to RabbitMQ
    await messageQueueService.connect();

    // Start server
    app.listen(config.port, () => {
      console.log(`🚀 Order Management Service running on port ${config.port}`);
      console.log(`📚 API Documentation available at http://localhost:${config.port}/api-docs`);
      console.log(`❤️ Health check available at http://localhost:${config.port}/health`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  await messageQueueService.close();
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  await messageQueueService.close();
  await sequelize.close();
  process.exit(0);
});

startServer();

module.exports = app;