# services/menu-inventory/src/routes/menu_ingredients_routes.py
from flask import Blueprint, request, jsonify
from models import db, MenuItem, InventoryItem, menu_inventory_association
from sqlalchemy.exc import IntegrityError
from marshmallow import Schema, fields, ValidationError
import uuid

menu_ingredients_bp = Blueprint('menu_ingredients', __name__)

# Schema for menu-ingredient association
class MenuIngredientSchema(Schema):
    inventory_item_id = fields.Str(required=True)
    quantity = fields.Float(required=True, validate=lambda x: x > 0)
    unit = fields.Str(required=True, validate=lambda x: len(x) <= 20)

menu_ingredient_schema = MenuIngredientSchema()
menu_ingredients_schema = MenuIngredientSchema(many=True)

@menu_ingredients_bp.route('/<string:menu_id>/ingredients', methods=['GET'])
def get_menu_ingredients(menu_id):
    """Get all ingredients for a specific menu item"""
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
        
        # Get ingredients with quantities from association table
        ingredients_data = []
        
        # Query the association table directly
        associations = db.session.execute(
            menu_inventory_association.select().where(
                menu_inventory_association.c.menu_item_id == menu_id
            )
        ).fetchall()
        
        for assoc in associations:
            inventory_item = InventoryItem.query.get(assoc.inventory_item_id)
            if inventory_item:
                ingredients_data.append({
                    'inventory_item': inventory_item.to_dict(),
                    'quantity': float(assoc.quantity),
                    'unit': assoc.unit
                })
        
        return jsonify({
            'success': True,
            'data': {
                'menu_item_id': menu_id,
                'menu_item_name': menu_item.name,
                'ingredients': ingredients_data
            },
            'count': len(ingredients_data)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error fetching menu ingredients',
            'error': str(e)
        }), 500

@menu_ingredients_bp.route('/<string:menu_id>/ingredients', methods=['POST'])
def add_ingredient_to_menu(menu_id):
    """Add an ingredient to a menu item"""
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
        
        # Validate request data
        try:
            data = menu_ingredient_schema.load(request.json)
        except ValidationError as err:
            return jsonify({
                'success': False,
                'message': 'Validation error',
                'errors': err.messages
            }), 400
        
        # Validate inventory item exists
        try:
            uuid.UUID(data['inventory_item_id'])
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid inventory item ID format'
            }), 400
        
        inventory_item = InventoryItem.query.get(data['inventory_item_id'])
        
        if not inventory_item:
            return jsonify({
                'success': False,
                'message': 'Inventory item not found'
            }), 404
        
        # Check if association already exists
        existing = db.session.execute(
            menu_inventory_association.select().where(
                (menu_inventory_association.c.menu_item_id == menu_id) &
                (menu_inventory_association.c.inventory_item_id == data['inventory_item_id'])
            )
        ).fetchone()
        
        if existing:
            return jsonify({
                'success': False,
                'message': 'Ingredient already associated with this menu item'
            }), 400
        
        # Insert association
        db.session.execute(
            menu_inventory_association.insert().values(
                menu_item_id=menu_id,
                inventory_item_id=data['inventory_item_id'],
                quantity=data['quantity'],
                unit=data['unit']
            )
        )
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Ingredient added to menu item successfully',
            'data': {
                'menu_item_id': menu_id,
                'inventory_item_id': data['inventory_item_id'],
                'quantity': data['quantity'],
                'unit': data['unit']
            }
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
            'message': 'Error adding ingredient to menu item',
            'error': str(e)
        }), 500

@menu_ingredients_bp.route('/<string:menu_id>/ingredients/<string:inventory_item_id>', methods=['PUT'])
def update_menu_ingredient(menu_id, inventory_item_id):
    """Update the quantity/unit of an ingredient in a menu item"""
    try:
        # Validate UUID formats
        try:
            uuid.UUID(menu_id)
            uuid.UUID(inventory_item_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid ID format'
            }), 400
        
        # Check if association exists
        existing = db.session.execute(
            menu_inventory_association.select().where(
                (menu_inventory_association.c.menu_item_id == menu_id) &
                (menu_inventory_association.c.inventory_item_id == inventory_item_id)
            )
        ).fetchone()
        
        if not existing:
            return jsonify({
                'success': False,
                'message': 'Ingredient association not found'
            }), 404
        
        # Validate request data (partial update)
        try:
            data = menu_ingredient_schema.load(request.json, partial=True)
        except ValidationError as err:
            return jsonify({
                'success': False,
                'message': 'Validation error',
                'errors': err.messages
            }), 400
        
        # Update association
        update_data = {}
        if 'quantity' in data:
            update_data['quantity'] = data['quantity']
        if 'unit' in data:
            update_data['unit'] = data['unit']
        
        if update_data:
            db.session.execute(
                menu_inventory_association.update().where(
                    (menu_inventory_association.c.menu_item_id == menu_id) &
                    (menu_inventory_association.c.inventory_item_id == inventory_item_id)
                ).values(**update_data)
            )
            
            db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Menu ingredient updated successfully',
            'data': {
                'menu_item_id': menu_id,
                'inventory_item_id': inventory_item_id,
                **update_data
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error updating menu ingredient',
            'error': str(e)
        }), 500

@menu_ingredients_bp.route('/<string:menu_id>/ingredients/<string:inventory_item_id>', methods=['DELETE'])
def remove_ingredient_from_menu(menu_id, inventory_item_id):
    """Remove an ingredient from a menu item"""
    try:
        # Validate UUID formats
        try:
            uuid.UUID(menu_id)
            uuid.UUID(inventory_item_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid ID format'
            }), 400
        
        # Check if association exists
        existing = db.session.execute(
            menu_inventory_association.select().where(
                (menu_inventory_association.c.menu_item_id == menu_id) &
                (menu_inventory_association.c.inventory_item_id == inventory_item_id)
            )
        ).fetchone()
        
        if not existing:
            return jsonify({
                'success': False,
                'message': 'Ingredient association not found'
            }), 404
        
        # Delete association
        db.session.execute(
            menu_inventory_association.delete().where(
                (menu_inventory_association.c.menu_item_id == menu_id) &
                (menu_inventory_association.c.inventory_item_id == inventory_item_id)
            )
        )
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Ingredient removed from menu item successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error removing ingredient from menu item',
            'error': str(e)
        }), 500

@menu_ingredients_bp.route('/check-availability', methods=['POST'])
def check_menu_items_availability():
    """Check if menu items can be prepared based on inventory levels"""
    try:
        # Get all menu items or specific ones from request
        menu_item_ids = request.json.get('menu_item_ids', []) if request.json else []
        
        if menu_item_ids:
            # Validate all IDs
            for item_id in menu_item_ids:
                try:
                    uuid.UUID(item_id)
                except ValueError:
                    return jsonify({
                        'success': False,
                        'message': f'Invalid menu item ID format: {item_id}'
                    }), 400
            
            menu_items = MenuItem.query.filter(MenuItem.id.in_(menu_item_ids)).all()
        else:
            menu_items = MenuItem.query.all()
        
        availability_data = []
        
        for menu_item in menu_items:
            # Get ingredients for this menu item
            associations = db.session.execute(
                menu_inventory_association.select().where(
                    menu_inventory_association.c.menu_item_id == str(menu_item.id)
                )
            ).fetchall()
            
            can_prepare = True
            missing_ingredients = []
            required_ingredients = []
            
            for assoc in associations:
                inventory_item = InventoryItem.query.get(assoc.inventory_item_id)
                if inventory_item:
                    required_ingredients.append({
                        'name': inventory_item.name,
                        'required_quantity': float(assoc.quantity),
                        'available_quantity': float(inventory_item.current_stock),
                        'unit': assoc.unit
                    })
                    
                    if inventory_item.current_stock < assoc.quantity:
                        can_prepare = False
                        missing_ingredients.append({
                            'name': inventory_item.name,
                            'required': float(assoc.quantity),
                            'available': float(inventory_item.current_stock),
                            'missing': float(assoc.quantity - inventory_item.current_stock),
                            'unit': assoc.unit
                        })
            
            availability_data.append({
                'menu_item': menu_item.to_dict(),
                'can_prepare': can_prepare,
                'required_ingredients': required_ingredients,
                'missing_ingredients': missing_ingredients
            })
        
        return jsonify({
            'success': True,
            'data': availability_data,
            'summary': {
                'total_items_checked': len(availability_data),
                'available_items': len([item for item in availability_data if item['can_prepare']]),
                'unavailable_items': len([item for item in availability_data if not item['can_prepare']])
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error checking menu items availability',
            'error': str(e)
        }), 500