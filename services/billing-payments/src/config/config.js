require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3003,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'billing_db',
    username: process.env.DB_USER || 'billing_user',
    password: process.env.DB_PASSWORD || 'billing_password',
    dialect: 'postgres',
    logging: process.env.NODE_ENV !== 'production'
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://admin:password@localhost:5672'
  },
  services: {
    orderService: process.env.ORDER_SERVICE_URL || 'http://localhost:3002'
  }
};