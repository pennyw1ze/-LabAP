require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3002,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'orders_db',
    username: process.env.DB_USER || 'orders_user',
    password: process.env.DB_PASSWORD || 'orders_password',
    dialect: 'postgres',
    logging: process.env.NODE_ENV !== 'production'
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://admin:password@localhost:5672'
  },
  services: {
    menuService: process.env.MENU_SERVICE_URL || 'http://localhost:3001'
  }
};