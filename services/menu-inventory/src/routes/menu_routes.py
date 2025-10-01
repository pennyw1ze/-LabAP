from flask import Blueprint, request, jsonify
from models import db, MenuItem
from sqlalchemy.exc import IntegrityError
from sqlalchemy import inspect
from marshmallow import Schema, fields, ValidationError
import uuid
import json

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
        
        menu_item = MenuItem.query.get(menu_id)
        
        if not menu_item:
            return jsonify({
                'success': False,
                'message': 'Menu item not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': menu_item.to_dict()
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
    """Update menu item"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(menu_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid menu item ID format'
            }), 400
        
        menu_item = MenuItem.query.get(menu_id)
        
        if not menu_item:
            return jsonify({
                'success': False,
                'message': 'Menu item not found'
            }), 404
        
        # Validate request data (partial validation for updates)
        try:
            data = menu_item_schema.load(request.json, partial=True)
        except ValidationError as err:
            return jsonify({
                'success': False,
                'message': 'Validation error',
                'errors': err.messages
            }), 400
        
        # Update menu item fields
        for key, value in data.items():
            if key == 'allergens':
                setattr(menu_item, key, json.dumps(value) if value is not None else None)
            elif key == 'nutritional_info':
                setattr(menu_item, key, json.dumps(value) if value is not None else None)
            elif hasattr(menu_item, key):
                setattr(menu_item, key, value)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Menu item updated successfully',
            'data': menu_item.to_dict()
        })
        
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
    """Delete menu item"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(menu_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid menu item ID format'
            }), 400
        
        menu_item = MenuItem.query.get(menu_id)
        
        if not menu_item:
            return jsonify({
                'success': False,
                'message': 'Menu item not found'
            }), 404

        inspector = inspect(db.engine)
        if inspector.has_table('menu_inventory_items'):
            db.session.execute(
                'DELETE FROM menu_inventory_items WHERE menu_item_id = :menu_id',
                {'menu_id': menu_id}
            )

        db.session.delete(menu_item)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Menu item deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error deleting menu item',
            'error': str(e)
        }), 500
