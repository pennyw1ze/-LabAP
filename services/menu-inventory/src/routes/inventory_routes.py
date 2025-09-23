from flask import Blueprint, request, jsonify
from models import db, InventoryItem
from sqlalchemy.exc import IntegrityError
from marshmallow import Schema, fields, ValidationError
from datetime import datetime
import uuid

inventory_bp = Blueprint('inventory', __name__)

# Marshmallow schemas for validation
class InventoryItemSchema(Schema):
    name = fields.Str(required=True, validate=lambda x: 1 <= len(x) <= 100)
    description = fields.Str(allow_none=True)
    current_stock = fields.Float(required=True, validate=lambda x: x >= 0)
    minimum_stock = fields.Float(required=True, validate=lambda x: x >= 0)
    maximum_stock = fields.Float(required=True, validate=lambda x: x > 0)
    unit = fields.Str(required=True, validate=lambda x: len(x) <= 20)
    cost_per_unit = fields.Float(required=True, validate=lambda x: x >= 0)
    supplier = fields.Str(allow_none=True, validate=lambda x: len(x) <= 100 if x else True)
    expiry_date = fields.Date(allow_none=True)
    is_perishable = fields.Bool()

inventory_item_schema = InventoryItemSchema()
inventory_items_schema = InventoryItemSchema(many=True)

@inventory_bp.route('/', methods=['GET'])
def get_all_inventory_items():
    """Get all inventory items with optional filtering"""
    try:
        # Get query parameters
        low_stock_only = request.args.get('low_stock') == 'true'
        out_of_stock_only = request.args.get('out_of_stock') == 'true'
        perishable_only = request.args.get('perishable') == 'true'
        
        # Build query
        query = InventoryItem.query
        
        if perishable_only:
            query = query.filter(InventoryItem.is_perishable == True)
        
        inventory_items = query.order_by(InventoryItem.name).all()
        
        # Apply Python-level filters for computed properties
        if low_stock_only:
            inventory_items = [item for item in inventory_items if item.is_low_stock]
        elif out_of_stock_only:
            inventory_items = [item for item in inventory_items if item.is_out_of_stock]
        
        return jsonify({
            'success': True,
            'data': [item.to_dict() for item in inventory_items],
            'count': len(inventory_items)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error fetching inventory items',
            'error': str(e)
        }), 500

@inventory_bp.route('/alerts', methods=['GET'])
def get_inventory_alerts():
    """Get inventory alerts (low stock, out of stock, expiring items)"""
    try:
        all_items = InventoryItem.query.all()
        
        low_stock_items = [item for item in all_items if item.is_low_stock and not item.is_out_of_stock]
        out_of_stock_items = [item for item in all_items if item.is_out_of_stock]
        
        # Find expiring items (within 7 days for perishable items)
        expiring_items = []
        current_date = datetime.now().date()
        for item in all_items:
            if item.is_perishable and item.expiry_date:
                days_until_expiry = (item.expiry_date - current_date).days
                if 0 <= days_until_expiry <= 7:
                    expiring_items.append({
                        **item.to_dict(),
                        'days_until_expiry': days_until_expiry
                    })
        
        return jsonify({
            'success': True,
            'data': {
                'low_stock': [item.to_dict() for item in low_stock_items],
                'out_of_stock': [item.to_dict() for item in out_of_stock_items],
                'expiring_soon': expiring_items
            },
            'summary': {
                'low_stock_count': len(low_stock_items),
                'out_of_stock_count': len(out_of_stock_items),
                'expiring_soon_count': len(expiring_items)
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error fetching inventory alerts',
            'error': str(e)
        }), 500

@inventory_bp.route('/<string:item_id>', methods=['GET'])
def get_inventory_item_by_id(item_id):
    """Get inventory item by ID"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(item_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid inventory item ID format'
            }), 400
        
        inventory_item = InventoryItem.query.get(item_id)
        
        if not inventory_item:
            return jsonify({
                'success': False,
                'message': 'Inventory item not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': inventory_item.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error fetching inventory item',
            'error': str(e)
        }), 500

@inventory_bp.route('/', methods=['POST'])
def create_inventory_item():
    """Create a new inventory item"""
    try:
        # Validate request data
        try:
            data = inventory_item_schema.load(request.json)
        except ValidationError as err:
            return jsonify({
                'success': False,
                'message': 'Validation error',
                'errors': err.messages
            }), 400
        
        # Create new inventory item
        inventory_item = InventoryItem(
            name=data['name'],
            description=data.get('description'),
            current_stock=data['current_stock'],
            minimum_stock=data['minimum_stock'],
            maximum_stock=data['maximum_stock'],
            unit=data['unit'],
            cost_per_unit=data['cost_per_unit'],
            supplier=data.get('supplier'),
            expiry_date=data.get('expiry_date'),
            is_perishable=data.get('is_perishable', False)
        )
        
        db.session.add(inventory_item)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Inventory item created successfully',
            'data': inventory_item.to_dict()
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
            'message': 'Error creating inventory item',
            'error': str(e)
        }), 500

@inventory_bp.route('/<string:item_id>', methods=['PUT'])
def update_inventory_item(item_id):
    """Update inventory item"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(item_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid inventory item ID format'
            }), 400
        
        inventory_item = InventoryItem.query.get(item_id)
        
        if not inventory_item:
            return jsonify({
                'success': False,
                'message': 'Inventory item not found'
            }), 404
        
        # Validate request data (partial validation for updates)
        try:
            data = inventory_item_schema.load(request.json, partial=True)
        except ValidationError as err:
            return jsonify({
                'success': False,
                'message': 'Validation error',
                'errors': err.messages
            }), 400
        
        # Update inventory item fields
        for key, value in data.items():
            if hasattr(inventory_item, key):
                setattr(inventory_item, key, value)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Inventory item updated successfully',
            'data': inventory_item.to_dict()
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
            'message': 'Error updating inventory item',
            'error': str(e)
        }), 500

@inventory_bp.route('/<string:item_id>', methods=['DELETE'])
def delete_inventory_item(item_id):
    """Delete inventory item"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(item_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid inventory item ID format'
            }), 400
        
        inventory_item = InventoryItem.query.get(item_id)
        
        if not inventory_item:
            return jsonify({
                'success': False,
                'message': 'Inventory item not found'
            }), 404
        
        db.session.delete(inventory_item)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Inventory item deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error deleting inventory item',
            'error': str(e)
        }), 500

@inventory_bp.route('/<string:item_id>/adjust', methods=['POST'])
def adjust_inventory_stock(item_id):
    """Adjust inventory stock (add or subtract)"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(item_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid inventory item ID format'
            }), 400
        
        inventory_item = InventoryItem.query.get(item_id)
        
        if not inventory_item:
            return jsonify({
                'success': False,
                'message': 'Inventory item not found'
            }), 404
        
        # Validate adjustment data
        if not request.json or 'adjustment' not in request.json:
            return jsonify({
                'success': False,
                'message': 'Adjustment amount is required'
            }), 400
        
        try:
            adjustment = float(request.json['adjustment'])
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'message': 'Invalid adjustment amount'
            }), 400
        
        # Calculate new stock level
        new_stock = inventory_item.current_stock + adjustment
        
        if new_stock < 0:
            return jsonify({
                'success': False,
                'message': 'Cannot reduce stock below zero'
            }), 400
        
        inventory_item.current_stock = new_stock
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Inventory stock adjusted successfully',
            'data': inventory_item.to_dict(),
            'adjustment': adjustment
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error adjusting inventory stock',
            'error': str(e)
        }), 500