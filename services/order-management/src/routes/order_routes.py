from flask import Blueprint, request, jsonify
from models import db, Order, OrderItem
from services.menu_service import MenuService
from services.message_queue_service import mq_service
from sqlalchemy.exc import IntegrityError
from marshmallow import Schema, fields, ValidationError
from datetime import datetime, timedelta
import uuid
import secrets
import string

order_bp = Blueprint('orders', __name__)

# Marshmallow schemas for validation
class OrderItemSchema(Schema):
    menu_item_id = fields.Str(required=True)
    quantity = fields.Int(required=True, validate=lambda x: x > 0)
    special_instructions = fields.Str(allow_none=True)

class OrderSchema(Schema):
    table_number = fields.Int(allow_none=True, validate=lambda x: x > 0 if x else True)
    customer_name = fields.Str(allow_none=True, validate=lambda x: len(x) <= 100 if x else True)
    order_type = fields.Str(validate=lambda x: x in ['dine_in', 'takeout', 'delivery'])
    items = fields.List(fields.Nested(OrderItemSchema), required=True, validate=lambda x: len(x) > 0)
    special_instructions = fields.Str(allow_none=True)

class OrderUpdateSchema(Schema):
    status = fields.Str(validate=lambda x: x in ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])
    table_number = fields.Int(allow_none=True, validate=lambda x: x > 0 if x else True)
    customer_name = fields.Str(allow_none=True, validate=lambda x: len(x) <= 100 if x else True)
    special_instructions = fields.Str(allow_none=True)

order_schema = OrderSchema()
order_update_schema = OrderUpdateSchema()

def generate_order_number():
    """Generate a unique order number"""
    timestamp = datetime.now().strftime('%Y%m%d')
    random_suffix = ''.join(secrets.choice(string.digits) for _ in range(4))
    return f"ORD-{timestamp}-{random_suffix}"

def calculate_order_totals(items_data, menu_items_info):
    """Calculate order totals"""
    total_amount = 0
    
    for item_data in items_data:
        menu_item = menu_items_info.get(item_data['menu_item_id'])
        if menu_item:
            item_total = float(menu_item['price']) * item_data['quantity']
            total_amount += item_total
    
    # Calculate tax (assuming 10% tax rate)
    tax_amount = total_amount * 0.10
    
    # For now, no discount
    discount_amount = 0
    
    final_amount = total_amount + tax_amount - discount_amount
    
    return {
        'total_amount': total_amount,
        'tax_amount': tax_amount,
        'discount_amount': discount_amount,
        'final_amount': final_amount
    }

@order_bp.route('/', methods=['GET'])
def get_all_orders():
    """Get all orders with optional filtering"""
    try:
        # Get query parameters
        status = request.args.get('status')
        order_type = request.args.get('order_type')
        table_number = request.args.get('table_number')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Build query
        query = Order.query
        
        if status:
            query = query.filter(Order.status == status)
        if order_type:
            query = query.filter(Order.order_type == order_type)
        if table_number:
            query = query.filter(Order.table_number == int(table_number))
        if date_from:
            date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            query = query.filter(Order.created_at >= date_from_obj)
        if date_to:
            date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            query = query.filter(Order.created_at <= date_to_obj)
        
        # Execute query and order results
        orders = query.order_by(Order.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [order.to_dict() for order in orders],
            'count': len(orders)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error fetching orders',
            'error': str(e)
        }), 500

@order_bp.route('/<string:order_id>', methods=['GET'])
def get_order_by_id(order_id):
    """Get order by ID"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(order_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid order ID format'
            }), 400
        
        order = Order.query.get(order_id)
        
        if not order:
            return jsonify({
                'success': False,
                'message': 'Order not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': order.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error fetching order',
            'error': str(e)
        }), 500

@order_bp.route('/', methods=['POST'])
def create_order():
    """Create a new order"""
    try:
        # Validate request data
        try:
            data = order_schema.load(request.json)
        except ValidationError as err:
            return jsonify({
                'success': False,
                'message': 'Validation error',
                'errors': err.messages
            }), 400
        
        # Validate menu items exist and are available
        menu_item_ids = [item['menu_item_id'] for item in data['items']]
        
        try:
            # Get menu items information
            menu_items_info = {}
            for menu_item_id in menu_item_ids:
                menu_item = MenuService.get_menu_item(menu_item_id)
                if not menu_item:
                    return jsonify({
                        'success': False,
                        'message': f'Menu item {menu_item_id} not found or not available'
                    }), 400
                menu_items_info[menu_item_id] = menu_item
                
        except Exception as e:
            return jsonify({
                'success': False,
                'message': 'Error validating menu items',
                'error': str(e)
            }), 400
        
        # Calculate order totals
        totals = calculate_order_totals(data['items'], menu_items_info)
        
        # Calculate estimated completion time (sum of preparation times + 10 minutes buffer)
        total_prep_time = sum(menu_items_info[item['menu_item_id']]['preparation_time'] * item['quantity'] 
                             for item in data['items'])
        estimated_completion = datetime.utcnow() + timedelta(minutes=total_prep_time + 10)
        
        # Create order
        order = Order(
            order_number=generate_order_number(),
            table_number=data.get('table_number'),
            customer_name=data.get('customer_name'),
            order_type=data.get('order_type', 'dine_in'),
            special_instructions=data.get('special_instructions'),
            estimated_completion_time=estimated_completion,
            **totals
        )
        
        db.session.add(order)
        db.session.flush()  # Get the order ID
        
        # Create order items
        for item_data in data['items']:
            menu_item = menu_items_info[item_data['menu_item_id']]
            unit_price = float(menu_item['price'])
            total_price = unit_price * item_data['quantity']
            
            order_item = OrderItem(
                order_id=order.id,
                menu_item_id=item_data['menu_item_id'],
                menu_item_name=menu_item['name'],
                quantity=item_data['quantity'],
                unit_price=unit_price,
                total_price=total_price,
                special_instructions=item_data.get('special_instructions')
            )
            db.session.add(order_item)
        
        db.session.commit()
        
        # Publish order created event
        try:
            mq_service.publish_order_event('created', order.to_dict())
        except Exception as e:
            print(f"Warning: Failed to publish order event: {str(e)}")
        
        return jsonify({
            'success': True,
            'message': 'Order created successfully',
            'data': order.to_dict()
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
            'message': 'Error creating order',
            'error': str(e)
        }), 500

@order_bp.route('/<string:order_id>', methods=['PUT'])
def update_order(order_id):
    """Update order"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(order_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid order ID format'
            }), 400
        
        order = Order.query.get(order_id)
        
        if not order:
            return jsonify({
                'success': False,
                'message': 'Order not found'
            }), 404
        
        # Validate request data
        try:
            data = order_update_schema.load(request.json, partial=True)
        except ValidationError as err:
            return jsonify({
                'success': False,
                'message': 'Validation error',
                'errors': err.messages
            }), 400
        
        # Track status change for events
        old_status = order.status
        
        # Update order fields
        for key, value in data.items():
            if hasattr(order, key):
                setattr(order, key, value)
        
        db.session.commit()
        
        # Publish status change event if status was updated
        if 'status' in data and old_status != data['status']:
            try:
                mq_service.publish_order_event('status_changed', {
                    **order.to_dict(),
                    'old_status': old_status,
                    'new_status': data['status']
                })
            except Exception as e:
                print(f"Warning: Failed to publish order event: {str(e)}")
        
        return jsonify({
            'success': True,
            'message': 'Order updated successfully',
            'data': order.to_dict()
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
            'message': 'Error updating order',
            'error': str(e)
        }), 500

@order_bp.route('/<string:order_id>/status', methods=['PATCH'])
def update_order_status(order_id):
    """Update order status only"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(order_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid order ID format'
            }), 400
        
        order = Order.query.get(order_id)
        
        if not order:
            return jsonify({
                'success': False,
                'message': 'Order not found'
            }), 404
        
        if not request.json or 'status' not in request.json:
            return jsonify({
                'success': False,
                'message': 'Status is required'
            }), 400
        
        new_status = request.json['status']
        valid_statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']
        
        if new_status not in valid_statuses:
            return jsonify({
                'success': False,
                'message': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
            }), 400
        
        old_status = order.status
        order.status = new_status
        
        db.session.commit()
        
        # Publish status change event
        try:
            mq_service.publish_order_event('status_changed', {
                **order.to_dict(),
                'old_status': old_status,
                'new_status': new_status
            })
        except Exception as e:
            print(f"Warning: Failed to publish order event: {str(e)}")
        
        return jsonify({
            'success': True,
            'message': 'Order status updated successfully',
            'data': order.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error updating order status',
            'error': str(e)
        }), 500

@order_bp.route('/<string:order_id>/cancel', methods=['POST'])
def cancel_order(order_id):
    """Cancel an order"""
    try:
        # Validate UUID format
        try:
            uuid.UUID(order_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid order ID format'
            }), 400
        
        order = Order.query.get(order_id)
        
        if not order:
            return jsonify({
                'success': False,
                'message': 'Order not found'
            }), 404
        
        if order.status in ['delivered', 'cancelled']:
            return jsonify({
                'success': False,
                'message': f'Cannot cancel order with status: {order.status}'
            }), 400
        
        old_status = order.status
        order.status = 'cancelled'
        
        # Cancel all order items
        for item in order.items:
            item.status = 'cancelled'
        
        db.session.commit()
        
        # Publish cancellation event
        try:
            mq_service.publish_order_event('cancelled', {
                **order.to_dict(),
                'old_status': old_status,
                'cancellation_reason': request.json.get('reason', 'No reason provided') if request.json else 'No reason provided'
            })
        except Exception as e:
            print(f"Warning: Failed to publish order event: {str(e)}")
        
        return jsonify({
            'success': True,
            'message': 'Order cancelled successfully',
            'data': order.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Error cancelling order',
            'error': str(e)
        }), 500