require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  services: {
    menuService: process.env.MENU_SERVICE_URL || 'http://localhost:3001',
    orderService: process.env.ORDER_SERVICE_URL || 'http://localhost:3002',
    billingService: process.env.BILLING_SERVICE_URL || 'http://localhost:3003',
    analyticsService: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3004'
  }
};