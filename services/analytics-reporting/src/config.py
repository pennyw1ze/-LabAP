import os
from datetime import timedelta

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # Redis
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379')
    
    # RabbitMQ
    RABBITMQ_URL = os.environ.get('RABBITMQ_URL', 'amqp://admin:password@localhost:5672')
    
    # External services
    MENU_SERVICE_URL = os.environ.get('MENU_SERVICE_URL', 'http://localhost:3001')
    ORDER_SERVICE_URL = os.environ.get('ORDER_SERVICE_URL', 'http://localhost:3002')
    BILLING_SERVICE_URL = os.environ.get('BILLING_SERVICE_URL', 'http://localhost:3003')
    
    # Flask settings
    PORT = int(os.environ.get('PORT', 3004))
    DEBUG = os.environ.get('FLASK_ENV') == 'development'
    
    # JWT
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_ALGORITHM = 'HS256'

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False

class TestConfig(Config):
    """Test configuration."""
    TESTING = True

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestConfig,
    'default': DevelopmentConfig
}