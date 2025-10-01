from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime
import os
import time

from config import config
from models import db
from routes.menu_routes import menu_bp


def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    CORS(app)

    # Register blueprints
    app.register_blueprint(menu_bp, url_prefix='/api/menu')

    # Health check endpoint
    @app.route('/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'menu-service',
            'timestamp': datetime.utcnow().isoformat(),
            'uptime': time.process_time()
        })

    # API Overview endpoint
    @app.route('/api')
    def api_overview():
        return jsonify({
            'service': 'ByteRisto Menu API',
            'version': '1.0.0',
            'endpoints': {
                'menu': {
                    'GET /api/menu/': 'Get all menu items',
                    'POST /api/menu/': 'Create menu item',
                    'GET /api/menu/{id}': 'Get menu item by ID',
                    'PUT /api/menu/{id}': 'Update menu item',
                    'DELETE /api/menu/{id}': 'Delete menu item',
                    'GET /api/menu/available': 'Get available menu items'
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

            # Add some sample data if tables are empty
            from models import MenuItem
            if MenuItem.query.count() == 0:
                add_sample_data()
                print("✅ Sample data added successfully")

        except Exception as e:
            print(f"❌ Error creating database tables: {str(e)}")

    return app


def add_sample_data():
    """Add some sample menu items for testing"""
    from models import MenuItem

    menu_items = [
        MenuItem(
            name="Pizza Margherita",
            description="Pizza classica con pomodoro, mozzarella e basilico fresco",
            price=8.50,
            category="main",
            is_available=True,
            preparation_time=15,
            allergens='["glutine", "latticini"]',
            nutritional_info='{"calories": 280, "protein": 12, "carbs": 35, "fat": 10}'
        ),
        MenuItem(
            name="Spaghetti Carbonara",
            description="Spaghetti con guanciale, uova e pecorino romano",
            price=12.00,
            category="main",
            is_available=True,
            preparation_time=20,
            allergens='["glutine", "uova"]',
            nutritional_info='{"calories": 450, "protein": 18, "carbs": 55, "fat": 18}'
        ),
        MenuItem(
            name="Caprese",
            description="Antipasto con mozzarella di bufala, pomodori e basilico",
            price=9.00,
            category="appetizer",
            is_available=True,
            preparation_time=5,
            allergens='["latticini"]',
            nutritional_info='{"calories": 200, "protein": 15, "carbs": 8, "fat": 14}'
        )
    ]

    for item in menu_items:
        db.session.add(item)

    db.session.commit()


if __name__ == '__main__':
    config_name = os.environ.get('FLASK_ENV', 'default')
    app = create_app(config_name)
    port = app.config.get('PORT', 3001)
    debug = app.config.get('DEBUG', True)

    print(f"🚀 Menu Service running on port {port}")
    print(f"❤️ Health check available at http://localhost:{port}/health")
    print(f"📖 API documentation at http://localhost:{port}/api")

    app.run(host='0.0.0.0', port=port, debug=debug)
