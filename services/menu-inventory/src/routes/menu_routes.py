from flask import Blueprint, request, jsonify
from models import db, MenuItem
from sqlalchemy.exc import IntegrityError
from sqlalchemy import inspect, text
from marshmallow import Schema, fields, ValidationError
import uuid
import json
import psycopg2
import os

menu_bp = Blueprint('menu', __name__)

# Marshmallow schemas for validation
class MenuItemSchema(Schema):
    name = fields.Str(required=True, validate=lambda x: 1 <= len(x) <= 100)
    description = fields.Str(allow_none=True)
    price = fields.Float(required=True, validate=lambda x: x >= 0)
    category = fields.Str(required=True, validate=lambda x: x in ['appetizer', 'main', 'dessert', 'beverage', 'side'])
    is_available = fields.Bool()
    preparation_time = fields.Int(required=True, validate=lambda x: x >= 1)
    allergens = fields.List(fields.Str(), allow_none=True)
    nutritional_info = fields.Dict(allow_none=True)

menu_item_schema = MenuItemSchema()
menu_items_schema = MenuItemSchema(many=True)

def get_db_connection():
    """Get database connection using app config"""
    from flask import current_app
    config = current_app.config
    
    # Try to get connection info from Flask config first
    try:
        # Use the config values directly (these come from environment variables)
        return psycopg2.connect(
            host=config.get('DB_HOST', 'localhost'),
            port=int(config.get('DB_PORT', '5432')),
            database=config.get('DB_NAME', 'menu_inventory_db'),
            user=config.get('DB_USER', 'menu_user'),
            password=config.get('DB_PASSWORD', 'menu_password')
        )
    except Exception as e:
        # Fallback to direct environment variables
        print(f"Failed to connect using config, trying env vars: {e}")
        return psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=int(os.getenv('DB_PORT', '5432')),
            database=os.getenv('DB_NAME', 'menu_inventory_db'),
            user=os.getenv('DB_USER', 'menu_user'),
            password=os.getenv('DB_PASSWORD', 'menu_password')
        )

@menu_bp.route('/', methods=['GET'])
def get_all_menu_items():
    """Get all menu items with optional filtering"""
    try:
        # Get query parameters
        category = request.args.get('category')
        available = request.args.get('available')
        
        # Build query
        query = MenuItem.query
        
        if category:
            query = query.filter(MenuItem.category == category)
        if available is not None:
            is_available = available.lower() == 'true'
            query = query.filter(MenuItem.is_available == is_available)
        
        # Execute query and order results
        menu_items = query.order_by(MenuItem.category, MenuItem.name).all()
        
        return jsonify({
            'success': True,
            'data': [item.to_dict() for item in menu_items],
            'count': len(menu_items)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error fetching menu items',
            'error': str(e)
        }), 500

@menu_bp.route('/available', methods=['GET'])
def get_available_menu_items():
    """Get available menu items for ordering"""
    try:
        menu_items = MenuItem.query.filter(MenuItem.is_available == True).all()
        
        return jsonify({
            'success': True,
            'data': [item.to_dict() for item in menu_items],
            'count': len(menu_items)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error fetching available menu items',
            'error': str(e)
        }), 500

@menu_bp.route('/<string:menu_id>', methods=['GET'])
def get_menu_item_by_id(menu_id):
    """Get menu item by ID"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(menu_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid menu item ID format'
            }), 400
        
        # Check if the item exists using text() for explicit SQL
        result = db.session.execute(
            text("SELECT * FROM menu_items WHERE id = :menu_id"),
            {'menu_id': menu_id}
        ).fetchone()
        
        if not result:
            return jsonify({
                'success': False,
                'message': 'Menu item not found'
            }), 404
        
        # Convert result to dict format
        row_dict = dict(result._mapping)
        menu_item_dict = {
            'id': row_dict['id'],
            'name': row_dict['name'],
            'description': row_dict['description'],
            'price': float(row_dict['price']) if row_dict['price'] else 0,
            'category': row_dict['category'],
            'is_available': row_dict['is_available'],
            'preparation_time': row_dict['preparation_time'],
            'allergens': json.loads(row_dict['allergens']) if row_dict['allergens'] else [],
            'nutritional_info': json.loads(row_dict['nutritional_info']) if row_dict['nutritional_info'] else {},
            'created_at': row_dict['created_at'].isoformat() if row_dict['created_at'] else None,
            'updated_at': row_dict['updated_at'].isoformat() if row_dict['updated_at'] else None
        }
        
        return jsonify({
            'success': True,
            'data': menu_item_dict
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error fetching menu item',
            'error': str(e)
        }), 500

@menu_bp.route('/', methods=['POST'])
def create_menu_item():
    """Create a new menu item"""
    try:
        # Validate request data
        try:
            data = menu_item_schema.load(request.json)
        except ValidationError as err:
            return jsonify({
                'success': False,
                'message': 'Validation error',
                'errors': err.messages
            }), 400
        
        # Create new menu item
        menu_item = MenuItem(
            name=data['name'],
            description=data.get('description'),
            price=data['price'],
            category=data['category'],
            is_available=data.get('is_available', True),
            preparation_time=data['preparation_time'],
            allergens=json.dumps(data.get('allergens')) if data.get('allergens') is not None else None,
            nutritional_info=json.dumps(data.get('nutritional_info')) if data.get('nutritional_info') is not None else None
        )
        
        db.session.add(menu_item)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Menu item created successfully',
            'data': menu_item.to_dict()
        }), 201
        
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Database integrity error',
            'error': str(e.orig)
        }), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error creating menu item',
            'error': str(e)
        }), 500

@menu_bp.route('/<string:menu_id>', methods=['PUT'])
def update_menu_item(menu_id):
    """Update menu item using raw SQL (temporary fix for UUID issues)"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(menu_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid menu item ID format'
            }), 400
        
        # Get request data
        data = request.json
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            # Check if item exists
            cursor.execute("SELECT id FROM menu_items WHERE id = %s", (menu_id,))
            if not cursor.fetchone():
                return jsonify({
                    'success': False,
                    'message': 'Menu item not found'
                }), 404
            
            # Build update query dynamically
            update_fields = []
            update_values = []
            
            if 'is_available' in data:
                update_fields.append("is_available = %s")
                update_values.append(bool(data['is_available']))
            if 'name' in data:
                update_fields.append("name = %s")
                update_values.append(data['name'])
            if 'description' in data:
                update_fields.append("description = %s")
                update_values.append(data['description'])
            if 'price' in data:
                update_fields.append("price = %s")
                update_values.append(float(data['price']))
            if 'category' in data:
                update_fields.append("category = %s")
                update_values.append(data['category'])
            if 'preparation_time' in data:
                update_fields.append("preparation_time = %s")
                update_values.append(int(data['preparation_time']))
            if 'allergens' in data:
                update_fields.append("allergens = %s")
                update_values.append(json.dumps(data['allergens']) if data['allergens'] is not None else None)
            if 'nutritional_info' in data:
                update_fields.append("nutritional_info = %s")
                update_values.append(json.dumps(data['nutritional_info']) if data['nutritional_info'] is not None else None)
            
            if update_fields:
                update_fields.append("updated_at = CURRENT_TIMESTAMP")
                update_query = f"UPDATE menu_items SET {', '.join(update_fields)} WHERE id = %s"
                update_values.append(menu_id)
                
                cursor.execute(update_query, update_values)
                conn.commit()
            
            # Get updated item
            cursor.execute("SELECT * FROM menu_items WHERE id = %s", (menu_id,))
            result = cursor.fetchone()
            
            if result:
                columns = [desc[0] for desc in cursor.description]
                row_dict = dict(zip(columns, result))
                
                updated_item = {
                    'id': row_dict['id'],
                    'name': row_dict['name'],
                    'description': row_dict['description'],
                    'price': float(row_dict['price']) if row_dict['price'] else 0,
                    'category': row_dict['category'],
                    'is_available': row_dict['is_available'],
                    'preparation_time': row_dict['preparation_time'],
                    'allergens': json.loads(row_dict['allergens']) if row_dict['allergens'] else [],
                    'nutritional_info': json.loads(row_dict['nutritional_info']) if row_dict['nutritional_info'] else {},
                    'created_at': row_dict['created_at'].isoformat() if row_dict['created_at'] else None,
                    'updated_at': row_dict['updated_at'].isoformat() if row_dict['updated_at'] else None
                }
                
                return jsonify({
                    'success': True,
                    'message': 'Menu item updated successfully',
                    'data': updated_item
                })
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error updating menu item',
            'error': str(e)
        }), 500
        
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Database integrity error',
            'error': str(e.orig)
        }), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error updating menu item',
            'error': str(e)
        }), 500

@menu_bp.route('/<string:menu_id>', methods=['DELETE'])
def delete_menu_item(menu_id):
    """Delete menu item using raw SQL"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(menu_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid menu item ID format'
            }), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            # Check if item exists
            cursor.execute("SELECT id FROM menu_items WHERE id = %s", (menu_id,))
            result = cursor.fetchone()
            
            if not result:
                return jsonify({
                    'success': False,
                    'message': 'Menu item not found'
                }), 404

            # Delete using explicit SQL
            cursor.execute("DELETE FROM menu_items WHERE id = %s", (menu_id,))
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': 'Menu item deleted successfully'
            })
            
        finally:
            cursor.close()
            conn.close()
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error deleting menu item',
            'error': str(e)
        }), 500
