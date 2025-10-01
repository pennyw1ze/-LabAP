from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime
import os
import time

from config import config
from models import db
from routes.order_routes import order_bp

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(order_bp, url_prefix='/api/orders')
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'order-management-service',
            'timestamp': datetime.utcnow().isoformat(),
            'uptime': time.process_time()
        })
    
    # API Overview endpoint
    @app.route('/api')
    def api_overview():
        return jsonify({
            'service': 'ByteRisto Order Management API',
            'version': '2.0.0',
            'endpoints': {
                'orders': {
                    'GET /api/orders/': 'Get all orders (filter by status, table_number, order_type)',
                    'POST /api/orders/': 'Create new order',
                    'GET /api/orders/{id}': 'Get order by ID',
                    'PUT /api/orders/{id}/status': 'Update order status',
                    'PUT /api/orders/{id}/items/{item_id}/status': 'Update order item status',
                    'DELETE /api/orders/{id}': 'Delete order (pending/cancelled only)'
                }
            }
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
        db.session.rollback()
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
    
    # Initialize database
    with app.app_context():
        try:
            db.create_all()
            print("✅ Database tables created successfully")
        except Exception as e:
            print(f"❌ Error creating database tables: {str(e)}")
    
    return app

if __name__ == '__main__':
    config_name = os.environ.get('FLASK_ENV', 'default')
    app = create_app(config_name)
    port = app.config.get('PORT', 3002)
    debug = app.config.get('DEBUG', True)
    
    print(f"🚀 Order Management Service running on port {port}")
    print(f"❤️ Health check available at http://localhost:{port}/health")
    print(f"📖 API documentation at http://localhost:{port}/api")
    
    app.run(host='0.0.0.0', port=port, debug=debug)