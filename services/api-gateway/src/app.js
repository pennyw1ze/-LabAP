const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('./config/config');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Swagger configuration for API Gateway
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ByteRisto API Gateway',
      version: '1.0.0',
      description: 'Restaurant Management System - Unified API Gateway for all microservices',
      contact: {
        name: 'ByteRisto Team',
        email: 'support@byteristo.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'API Gateway'
      }
    ],
    tags: [
      {
        name: 'Menu & Inventory',
        description: 'Menu and inventory management operations'
      },
      {
        name: 'Orders',
        description: 'Order management operations'
      },
      {
        name: 'Billing',
        description: 'Billing and payment operations'
      },
      {
        name: 'Analytics',
        description: 'Analytics and reporting operations'
      }
    ]
  },
  apis: []
};

const specs = swaggerJsdoc(swaggerOptions);

// Main API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customSiteTitle: 'ByteRisto API Documentation',
  customCss: '.topbar { display: none }',
  swaggerOptions: {
    urls: [
      {
        url: '/api-docs.json',
        name: 'API Gateway'
      },
      {
        url: `${config.services.menuService}/api-docs.json`,
        name: 'Menu & Inventory Service'
      },
      {
        url: `${config.services.orderService}/api-docs.json`,
        name: 'Order Management Service'
      }
    ]
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      menu: config.services.menuService,
      orders: config.services.orderService,
      billing: config.services.billingService,
      analytics: config.services.analyticsService
    }
  });
});

// Service status endpoint
app.get('/status', async (req, res) => {
  const services = {};
  
  // Check each service health
  for (const [name, url] of Object.entries(config.services)) {
    try {
      const response = await fetch(`${url}/health`);
      services[name] = {
        status: response.ok ? 'healthy' : 'unhealthy',
        url: url
      };
    } catch (error) {
      services[name] = {
        status: 'unreachable',
        url: url,
        error: error.message
      };
    }
  }
  
  res.json({
    success: true,
    services
  });
});

// Proxy configurations
const proxyOptions = {
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(502).json({
      success: false,
      message: 'Service temporarily unavailable',
      error: 'Bad Gateway'
    });
  }
};

// Route proxying to microservices
app.use('/api/menu', createProxyMiddleware({
  target: config.services.menuService,
  ...proxyOptions,
  pathRewrite: {
    '^/api/menu': '/api/menu'
  }
}));

app.use('/api/inventory', createProxyMiddleware({
  target: config.services.menuService,
  ...proxyOptions,
  pathRewrite: {
    '^/api/inventory': '/api/inventory'
  }
}));

app.use('/api/orders', createProxyMiddleware({
  target: config.services.orderService,
  ...proxyOptions,
  pathRewrite: {
    '^/api/orders': '/api/orders'
  }
}));

app.use('/api/billing', createProxyMiddleware({
  target: config.services.billingService,
  ...proxyOptions,
  pathRewrite: {
    '^/api/billing': '/api/billing'
  }
}));

app.use('/api/analytics', createProxyMiddleware({
  target: config.services.analyticsService,
  ...proxyOptions,
  pathRewrite: {
    '^/api/analytics': '/api/analytics'
  }
}));

// Welcome endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to ByteRisto Restaurant Management System',
    version: '1.0.0',
    description: 'Internal Restaurant Management System offering an all-in-one solution for menu, inventory, ordering, billing, and analytics',
    documentation: `/api-docs`,
    services: {
      'Menu & Inventory': '/api/menu, /api/inventory',
      'Order Management': '/api/orders',
      'Billing & Payments': '/api/billing',
      'Analytics & Reporting': '/api/analytics'
    }
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
    message: 'Route not found',
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /status',
      'GET /api-docs',
      'ALL /api/menu/*',
      'ALL /api/inventory/*',
      'ALL /api/orders/*',
      'ALL /api/billing/*',
      'ALL /api/analytics/*'
    ]
  });
});

// Start server
function startServer() {
  app.listen(config.port, () => {
    console.log(`🚀 ByteRisto API Gateway running on port ${config.port}`);
    console.log(`📚 API Documentation available at http://localhost:${config.port}/api-docs`);
    console.log(`❤️ Health check available at http://localhost:${config.port}/health`);
    console.log(`📊 Service status available at http://localhost:${config.port}/status`);
  });
}

startServer();

module.exports = app;