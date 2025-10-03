from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime
import os
import time

from config import config
from routes.gateway_routes import gateway_bp

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    CORS(app)
    
    # Configure Flask to handle trailing slashes flexibly
    app.url_map.strict_slashes = False
    
    # Register blueprints
    app.register_blueprint(gateway_bp, url_prefix='/api')
    
    # Root endpoint
    @app.route('/')
    def root():
        return jsonify({
            'service': 'ByteRisto API Gateway',
            'version': '1.0.0',
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'endpoints': {
                'health': '/health',
                'menu': '/api/menu',
                'orders': '/api/orders'
            }
        })
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        # Check health of all services
        services_health = {}
        
        try:
            import requests
            timeout = 5
            
            # Check menu service
            try:
                response = requests.get(f"{app.config['MENU_SERVICE_URL']}/health", timeout=timeout)
                services_health['menu-service'] = 'healthy' if response.status_code == 200 else 'unhealthy'
            except:
                services_health['menu-service'] = 'unavailable'
            
            # Check order service
            try:
                response = requests.get(f"{app.config['ORDER_SERVICE_URL']}/health", timeout=timeout)
                services_health['order-service'] = 'healthy' if response.status_code == 200 else 'unhealthy'
            except:
                services_health['order-service'] = 'unavailable'
            
        except Exception as e:
            print(f"Error checking service health: {str(e)}")
        
        return jsonify({
            'status': 'healthy',
            'service': 'api-gateway',
            'timestamp': datetime.utcnow().isoformat(),
            'uptime': time.process_time(),
            'services': services_health
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'message': 'Route not found'
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500
    
    @app.errorhandler(503)
    def service_unavailable(error):
        return jsonify({
            'success': False,
            'message': 'Service temporarily unavailable'
        }), 503
    
    return app

if __name__ == '__main__':
    config_name = os.environ.get('FLASK_ENV', 'default')
    app = create_app(config_name)
    port = app.config.get('PORT', 3000)
    debug = app.config.get('DEBUG', True)
    
    print(f"🚀 ByteRisto API Gateway running on port {port}")
    print(f"❤️ Health check available at http://localhost:{port}/health")
    print(f"📚 API endpoints available at http://localhost:{port}/api")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
