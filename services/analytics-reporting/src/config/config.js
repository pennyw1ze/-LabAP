require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3004,
  nodeEnv: process.env.NODE_ENV || 'development',
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://admin:password@localhost:5672'
  },
  services: {
    menuService: process.env.MENU_SERVICE_URL || 'http://localhost:3001',
    orderService: process.env.ORDER_SERVICE_URL || 'http://localhost:3002',
    billingService: process.env.BILLING_SERVICE_URL || 'http://localhost:3003'
  }
};