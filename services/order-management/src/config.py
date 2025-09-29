import os
from datetime import timedelta

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # Database
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_PORT = os.environ.get('DB_PORT', '5432')
    DB_NAME = os.environ.get('DB_NAME', 'order_management_db')
    DB_USER = os.environ.get('DB_USER', 'order_user')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', 'order_password')
    
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///order_management.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # External Services
    MENU_SERVICE_URL = os.environ.get('MENU_SERVICE_URL', 'http://localhost:3001')
    PAYMENT_SERVICE_URL = os.environ.get('PAYMENT_SERVICE_URL', 'http://localhost:3003')
    
    # RabbitMQ
    RABBITMQ_URL = os.environ.get('RABBITMQ_URL', 'amqp://admin:password@localhost:5672')
    
    # Flask settings
    PORT = int(os.environ.get('PORT', 3002))
    DEBUG = os.environ.get('FLASK_ENV') == 'development'
    
    # JWT
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_ALGORITHM = 'HS256'

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    MENU_SERVICE_URL = 'http://localhost:3001'

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    MENU_SERVICE_URL = os.environ.get('MENU_SERVICE_URL', 'http://menu-inventory-service:3001')

class TestConfig(Config):
    """Test configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestConfig,
    'default': DevelopmentConfig
}