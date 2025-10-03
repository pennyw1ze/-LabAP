import os
from datetime import timedelta

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # External services
    MENU_SERVICE_URL = os.environ.get('MENU_SERVICE_URL', 'http://localhost:3001')
    ORDER_SERVICE_URL = os.environ.get('ORDER_SERVICE_URL', 'http://localhost:3002')
    
    # Flask settings
    PORT = int(os.environ.get('PORT', 3000))
    DEBUG = os.environ.get('FLASK_ENV') == 'development'
    
    # JWT
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_ALGORITHM = 'HS256'
    
    # Request timeout
    REQUEST_TIMEOUT = 30

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
