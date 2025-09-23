from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime
import os
import time

from config import config
from routes.analytics_routes import analytics_bp

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'analytics-reporting-service',
            'timestamp': datetime.utcnow().isoformat(),
            'uptime': time.process_time()
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
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'success': False,
            'message': 'Bad request'
        }), 400
    
    return app

if __name__ == '__main__':
    config_name = os.environ.get('FLASK_ENV', 'default')
    app = create_app(config_name)
    port = app.config.get('PORT', 3004)
    debug = app.config.get('DEBUG', True)
    
    print(f"🚀 Analytics & Reporting Service running on port {port}")
    print(f"❤️ Health check available at http://localhost:{port}/health")
    
    app.run(host='0.0.0.0', port=port, debug=debug)