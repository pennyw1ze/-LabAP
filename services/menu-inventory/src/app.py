# services/menu-inventory/src/app.py - Updated version
from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime
import os
import time

from config import config
from models import db
from routes.menu_routes import menu_bp
from routes.inventory_routes import inventory_bp
from routes.menu_ingredients_routes import menu_ingredients_bp

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(menu_bp, url_prefix='/api/menu')
    app.register_blueprint(inventory_bp, url_prefix='/api/inventory')
    app.register_blueprint(menu_ingredients_bp, url_prefix='/api/menu')  # For menu/{id}/ingredients endpoints
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'menu-inventory-service',
            'timestamp': datetime.utcnow().isoformat(),
            'uptime': time.process_time()
        })
    
    # API Overview endpoint
    @app.route('/api')
    def api_overview():
        return jsonify({
            'service': 'ByteRisto Menu & Inventory API',
            'version': '1.0.0',
            'endpoints': {
                'menu': {
                    'GET /api/menu/': 'Get all menu items',
                    'POST /api/menu/': 'Create menu item',
                    'GET /api/menu/{id}': 'Get menu item by ID',
                    'PUT /api/menu/{id}': 'Update menu item',
                    'DELETE /api/menu/{id}': 'Delete menu item',
                    'GET /api/menu/available': 'Get available menu items',
                    'GET /api/menu/{id}/ingredients': 'Get menu item ingredients',
                    'POST /api/menu/{id}/ingredients': 'Add ingredient to menu item',
                    'PUT /api/menu/{id}/ingredients/{ingredient_id}': 'Update menu item ingredient',
                    'DELETE /api/menu/{id}/ingredients/{ingredient_id}': 'Remove ingredient from menu item',
                    'POST /api/menu/check-availability': 'Check menu items availability'
                },
                'inventory': {
                    'GET /api/inventory/': 'Get all inventory items',
                    'POST /api/inventory/': 'Create inventory item',
                    'GET /api/inventory/{id}': 'Get inventory item by ID',
                    'PUT /api/inventory/{id}': 'Update inventory item',
                    'DELETE /api/inventory/{id}': 'Delete inventory item',
                    'GET /api/inventory/alerts': 'Get inventory alerts',
                    'POST /api/inventory/{id}/adjust': 'Adjust inventory stock'
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
            from models import MenuItem, InventoryItem
            if MenuItem.query.count() == 0:
                add_sample_data()
                print("✅ Sample data added successfully")
                
        except Exception as e:
            print(f"❌ Error creating database tables: {str(e)}")
    
    return app

def add_sample_data():
    """Add some sample menu items and inventory items for testing"""
    from models import MenuItem, InventoryItem, menu_inventory_association
    
    # Sample inventory items
    inventory_items = [
        InventoryItem(
            name="Pomodori San Marzano",
            description="Pomodori pelati di alta qualità",
            current_stock=50.0,
            minimum_stock=10.0,
            maximum_stock=100.0,
            unit="kg",
            cost_per_unit=3.50,
            supplier="Agricola del Sud",
            is_perishable=True
        ),
        InventoryItem(
            name="Mozzarella di Bufala",
            description="Mozzarella fresca di bufala campana",
            current_stock=20.0,
            minimum_stock=5.0,
            maximum_stock=50.0,
            unit="kg",
            cost_per_unit=12.00,
            supplier="Caseificio Campano",
            is_perishable=True
        ),
        InventoryItem(
            name="Basilico Fresco",
            description="Basilico fresco biologico",
            current_stock=2.0,
            minimum_stock=0.5,
            maximum_stock=5.0,
            unit="kg",
            cost_per_unit=15.00,
            supplier="Orto Biologico",
            is_perishable=True
        ),
        InventoryItem(
            name="Pasta Spaghetti",
            description="Spaghetti di grano duro",
            current_stock=25.0,
            minimum_stock=5.0,
            maximum_stock=50.0,
            unit="kg",
            cost_per_unit=2.80,
            supplier="Pastificio Italiano",
            is_perishable=False
        ),
        InventoryItem(
            name="Guanciale",
            description="Guanciale stagionato",
            current_stock=8.0,
            minimum_stock=2.0,
            maximum_stock=15.0,
            unit="kg",
            cost_per_unit=18.00,
            supplier="Salumeria Romana",
            is_perishable=True
        )
    ]
    
    for item in inventory_items:
        db.session.add(item)
    
    # Sample menu items
    menu_items = [
        MenuItem(
            name="Pizza Margherita",
            description="Pizza classica con pomodoro, mozzarella e basilico fresco",
            price=8.50,
            category="main",
            is_available=True,
            preparation_time=15,
            allergens=["glutine", "latticini"],
            nutritional_info={"calories": 280, "protein": 12, "carbs": 35, "fat": 10}
        ),
        MenuItem(
            name="Spaghetti Carbonara",
            description="Spaghetti con guanciale, uova e pecorino romano",
            price=12.00,
            category="main",
            is_available=True,
            preparation_time=20,
            allergens=["glutine", "uova"],
            nutritional_info={"calories": 450, "protein": 18, "carbs": 55, "fat": 18}
        ),
        MenuItem(
            name="Caprese",
            description="Antipasto con mozzarella di bufala, pomodori e basilico",
            price=9.00,
            category="appetizer",
            is_available=True,
            preparation_time=5,
            allergens=["latticini"],
            nutritional_info={"calories": 200, "protein": 15, "carbs": 8, "fat": 14}
        )
    ]
    
    for item in menu_items:
        db.session.add(item)
    
    db.session.commit()
    
    # Add ingredient associations (after commit to get IDs)
    pizza_margherita = MenuItem.query.filter_by(name="Pizza Margherita").first()
    spaghetti_carbonara = MenuItem.query.filter_by(name="Spaghetti Carbonara").first()
    caprese = MenuItem.query.filter_by(name="Caprese").first()
    
    pomodori = InventoryItem.query.filter_by(name="Pomodori San Marzano").first()
    mozzarella = InventoryItem.query.filter_by(name="Mozzarella di Bufala").first()
    basilico = InventoryItem.query.filter_by(name="Basilico Fresco").first()
    pasta = InventoryItem.query.filter_by(name="Pasta Spaghetti").first()
    guanciale = InventoryItem.query.filter_by(name="Guanciale").first()
    
    # Pizza Margherita ingredients
    if pizza_margherita and pomodori and mozzarella and basilico:
        db.session.execute(
            menu_inventory_association.insert().values([
                {"menu_item_id": pizza_margherita.id, "inventory_item_id": pomodori.id, "quantity": 0.2, "unit": "kg"},
                {"menu_item_id": pizza_margherita.id, "inventory_item_id": mozzarella.id, "quantity": 0.15, "unit": "kg"},
                {"menu_item_id": pizza_margherita.id, "inventory_item_id": basilico.id, "quantity": 0.01, "unit": "kg"}
            ])
        )
    
    # Spaghetti Carbonara ingredients
    if spaghetti_carbonara and pasta and guanciale:
        db.session.execute(
            menu_inventory_association.insert().values([
                {"menu_item_id": spaghetti_carbonara.id, "inventory_item_id": pasta.id, "quantity": 0.1, "unit": "kg"},
                {"menu_item_id": spaghetti_carbonara.id, "inventory_item_id": guanciale.id, "quantity": 0.05, "unit": "kg"}
            ])
        )
    
    # Caprese ingredients
    if caprese and mozzarella and pomodori and basilico:
        db.session.execute(
            menu_inventory_association.insert().values([
                {"menu_item_id": caprese.id, "inventory_item_id": mozzarella.id, "quantity": 0.1, "unit": "kg"},
                {"menu_item_id": caprese.id, "inventory_item_id": pomodori.id, "quantity": 0.15, "unit": "kg"},
                {"menu_item_id": caprese.id, "inventory_item_id": basilico.id, "quantity": 0.005, "unit": "kg"}
            ])
        )
    
    db.session.commit()

if __name__ == '__main__':
    config_name = os.environ.get('FLASK_ENV', 'default')
    app = create_app(config_name)
    port = app.config.get('PORT', 3001)
    debug = app.config.get('DEBUG', True)
    
    print(f"🚀 Menu & Inventory Service running on port {port}")
    print(f"❤️ Health check available at http://localhost:{port}/health")
    print(f"📖 API documentation at http://localhost:{port}/api")
    
    app.run(host='0.0.0.0', port=port, debug=debug)