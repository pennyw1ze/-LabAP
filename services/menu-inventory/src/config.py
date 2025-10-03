import os
from datetime import timedelta

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # Database
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_PORT = os.environ.get('DB_PORT', '5432')
    DB_NAME = os.environ.get('DB_NAME', 'menu_inventory_db')
    DB_USER = os.environ.get('DB_USER', 'menu_user')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', 'menu_password')
    
    # Construct PostgreSQL URI from environment variables
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # RabbitMQ
    RABBITMQ_URL = os.environ.get('RABBITMQ_URL', 'amqp://admin:password@localhost:5672')
    
    # Flask settings
    PORT = int(os.environ.get('PORT', 3001))
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
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestConfig,
    'default': DevelopmentConfig
}