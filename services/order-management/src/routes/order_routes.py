from flask import Blueprint, request, jsonify
from models import db, Order, OrderItem
from sqlalchemy.exc import IntegrityError
from marshmallow import Schema, fields, ValidationError
from datetime import datetime, timedelta
import requests

order_bp = Blueprint('orders', __name__)

# Configuration - URL del menu service
MENU_SERVICE_URL = 'http://localhost:3001'

# Marshmallow schemas
class OrderItemSchema(Schema):
    menu_item_id = fields.Str(required=True)
    menu_item_name = fields.Str(required=True)
    quantity = fields.Int(required=True, validate=lambda x: x > 0)
    unit_price = fields.Float(required=True, validate=lambda x: x >= 0)
    total_price = fields.Float(required=True, validate=lambda x: x >= 0)
    special_instructions = fields.Str(allow_none=True)

    class Meta:
        unknown = 'exclude'  # Ignore unknown fields from frontend

class OrderSchema(Schema):
    table_number = fields.Int(required=True, validate=lambda x: x > 0)
    customer_name = fields.Str(allow_none=True)
    order_type = fields.Str(required=True, validate=lambda x: x in ['dine_in', 'takeout', 'delivery'])
    special_instructions = fields.Str(allow_none=True)
    total_amount = fields.Float(allow_none=True)  # Optional, for frontend convenience
    items = fields.List(fields.Nested(OrderItemSchema), required=True, validate=lambda x: len(x) > 0)

    class Meta:
        unknown = 'exclude'  # Ignore unknown fields from frontend

order_schema = OrderSchema()
order_items_schema = OrderItemSchema(many=True)


def generate_order_number():
    """Generate a unique order number"""
    import random
    prefix = datetime.now().strftime("%Y%m%d")
    suffix = random.randint(1000, 9999)
    return f"ORD-{prefix}-{suffix}"


def calculate_estimated_completion_time(items):
    """Calculate estimated completion time based on preparation times"""
    from models import italy_now
    # Get the maximum preparation time from all items
    max_prep_time = max([item.get('preparation_time', 15) for item in items], default=15)
    # Add 5 minutes buffer
    estimated_minutes = max_prep_time + 5
    return italy_now() + timedelta(minutes=estimated_minutes)


@order_bp.route('/', methods=['GET'])
def get_all_orders():
    """Get all orders with optional filtering"""
    try:
        # Query parameters
        status = request.args.get('status')
        table_number = request.args.get('table_number')
        order_type = request.args.get('order_type')
        
        query = Order.query
        
        # Apply filters
        if status:
            if status == 'active':
                # Active orders are pending, confirmed, or preparing
                query = query.filter(Order.status.in_(['pending', 'confirmed', 'preparing']))
            else:
                query = query.filter(Order.status == status)
        
        if table_number:
            query = query.filter(Order.table_number == int(table_number))
        
        if order_type:
            query = query.filter(Order.order_type == order_type)
        
        # Order by creation date (newest first)
        orders = query.order_by(Order.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [order.to_dict() for order in orders],
            'count': len(orders)
        })
        
    except Exception as e:
        print(f"Error in get_all_orders: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error fetching orders',
            'error': str(e)
        }), 500


@order_bp.route('/<string:order_id>', methods=['GET'])
def get_order_by_id(order_id):
    """Get order by ID"""
    try:
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
        print(f"Error in get_order_by_id: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error fetching order',
            'error': str(e)
        }), 500


@order_bp.route('/', methods=['POST'])
def create_order():
    """Create a new order"""
    try:
        data = request.json
        print(f"Received order data: {data}")
        
        # Validate request data
        try:
            validated_data = order_schema.load(data)
        except ValidationError as err:
            print(f"Validation error: {err.messages}")
            return jsonify({
                'success': False,
                'message': 'Validation error',
                'errors': err.messages
            }), 400
        
        # Verify menu items availability with menu service
        menu_item_ids = [item['menu_item_id'] for item in validated_data['items']]
        try:
            menu_response = requests.get(f"{MENU_SERVICE_URL}/api/menu/available", timeout=5)
            if menu_response.ok:
                available_items = {item['id']: item for item in menu_response.json().get('data', [])}
                
                # Check if all ordered items are available
                unavailable_items = []
                for item_id in menu_item_ids:
                    if item_id not in available_items:
                        unavailable_items.append(item_id)
                
                if unavailable_items:
                    return jsonify({
                        'success': False,
                        'message': 'Some menu items are not available',
                        'unavailable_items': unavailable_items
                    }), 400
        except Exception as e:
            print(f"Warning: Could not verify menu availability: {str(e)}")
            # Continue anyway - menu service might be temporarily unavailable
        
        # Calculate totals
        total_amount = sum(item['total_price'] for item in validated_data['items'])
        tax_amount = 0  # No tax applied - prices are final
        discount_amount = 0  # No discount for now
        final_amount = total_amount  # Final amount equals total amount without tax
        
        # Create order
        order = Order(
            order_number=generate_order_number(),
            table_number=validated_data['table_number'],
            customer_name=validated_data.get('customer_name'),
            order_type=validated_data['order_type'],
            status='confirmed',
            total_amount=total_amount,
            tax_amount=tax_amount,
            discount_amount=discount_amount,
            final_amount=final_amount,
            special_instructions=validated_data.get('special_instructions'),
            estimated_completion_time=calculate_estimated_completion_time(validated_data['items'])
        )
        
        db.session.add(order)
        db.session.flush()  # Get order ID
        
        # Create order items
        for item_data in validated_data['items']:
            order_item = OrderItem(
                order_id=order.id,  # Now it's already a string
                menu_item_id=item_data['menu_item_id'],  # Already a string
                menu_item_name=item_data['menu_item_name'],
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                total_price=item_data['total_price'],
                special_instructions=item_data.get('special_instructions'),
                status='preparing'
            )
            db.session.add(order_item)
        
        db.session.commit()
        
        print(f"Order created successfully: {order.order_number}")
        
        return jsonify({
            'success': True,
            'message': 'Order created successfully',
            'data': order.to_dict()
        }), 201
        
    except IntegrityError as e:
        db.session.rollback()
        print(f"IntegrityError: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Database integrity error',
            'error': str(e.orig) if hasattr(e, 'orig') else str(e)
        }), 400
    except Exception as e:
        db.session.rollback()
        print(f"Error in create_order: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Error creating order',
            'error': str(e)
        }), 500


@order_bp.route('/<string:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    """Update order status"""
    try:
        # Validate UUID format
        try:
            import uuid
            uuid.UUID(order_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid order ID format'
            }), 400
        
        # Find order using raw SQL (SQLite compatible)
        from sqlalchemy import text
        result = db.session.execute(
            text("SELECT * FROM orders WHERE id = :order_id"),
            {'order_id': order_id}
        ).fetchone()
        
        if not result:
            return jsonify({
                'success': False,
                'message': 'Order not found'
            }), 404
        
        data = request.json
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({
                'success': False,
                'message': 'Status is required'
            }), 400
        
        # Validate status
        valid_statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'payed', 'cancelled']
        if new_status not in valid_statuses:
            return jsonify({
                'success': False,
                'message': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
            }), 400
        
        print(f"Updating order {order_id} status to {new_status}")
        
        # Update order status using raw SQL (SQLite compatible)
        db.session.execute(
            text("UPDATE orders SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :order_id"),
            {'status': new_status, 'order_id': order_id}
        )
        
        # Update all items status when order status changes
        if new_status in ['preparing', 'ready', 'delivered']:
            db.session.execute(
                text("""
                    UPDATE order_items 
                    SET status = :item_status, updated_at = CURRENT_TIMESTAMP 
                    WHERE order_id = :order_id AND status = 'pending'
                """),
                {'item_status': new_status if new_status != 'confirmed' else 'pending', 'order_id': order_id}
            )
        
        db.session.commit()
        
        print(f"Order status updated successfully")
        
        # Get updated order data
        updated_order = db.session.execute(
            text("SELECT * FROM orders WHERE id = :order_id"),
            {'order_id': order_id}
        ).fetchone()
        
        # Get order items
        items_result = db.session.execute(
            text("SELECT * FROM order_items WHERE order_id = :order_id ORDER BY created_at"),
            {'order_id': order_id}
        ).fetchall()
        
        # Convert to dict format
        order_dict = dict(updated_order._mapping)
        order_dict['id'] = str(order_dict['id'])
        
        items_dict = []
        for item in items_result:
            item_dict = dict(item._mapping)
            item_dict['id'] = str(item_dict['id'])
            item_dict['order_id'] = str(item_dict['order_id'])
            item_dict['menu_item_id'] = str(item_dict['menu_item_id'])
            items_dict.append(item_dict)
        
        order_dict['items'] = items_dict
        
        return jsonify({
            'success': True,
            'message': 'Order status updated successfully',
            'data': order_dict
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in update_order_status: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Error updating order status',
            'error': str(e)
        }), 500


@order_bp.route('/<string:order_id>/items/<string:item_id>/status', methods=['PUT'])
def update_order_item_status(order_id, item_id):
    """Update order item status"""
    try:
        # Validate UUID formats
        try:
            import uuid
            uuid.UUID(order_id)
            uuid.UUID(item_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid ID format'
            }), 400
        
        # Find order using raw SQL (SQLite compatible)
        from sqlalchemy import text
        order_result = db.session.execute(
            text("SELECT * FROM orders WHERE id = :order_id"),
            {'order_id': order_id}
        ).fetchone()
        
        if not order_result:
            return jsonify({
                'success': False,
                'message': 'Order not found'
            }), 404
        
        # Find order item using raw SQL (SQLite compatible)
        item_result = db.session.execute(
            text("SELECT * FROM order_items WHERE id = :item_id AND order_id = :order_id"),
            {'item_id': item_id, 'order_id': order_id}
        ).fetchone()
        
        if not item_result:
            return jsonify({
                'success': False,
                'message': 'Order item not found'
            }), 404
        
        data = request.json
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({
                'success': False,
                'message': 'Status is required'
            }), 400
        
        # Validate status
        valid_statuses = ['pending', 'preparing', 'ready', 'served', 'cancelled']
        if new_status not in valid_statuses:
            return jsonify({
                'success': False,
                'message': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
            }), 400
        
        print(f"Updating item {item_id} status to {new_status}")
        
        # Update order item status using raw SQL (SQLite compatible)
        db.session.execute(
            text("""
                UPDATE order_items 
                SET status = :status, updated_at = CURRENT_TIMESTAMP 
                WHERE id = :item_id AND order_id = :order_id
            """),
            {'status': new_status, 'item_id': item_id, 'order_id': order_id}
        )
        
        # Check if all items are ready and update order status
        all_items_result = db.session.execute(
            text("""
                SELECT COUNT(*) as total_count,
                       COUNT(CASE WHEN status IN ('ready', 'served') THEN 1 END) as ready_count
                FROM order_items 
                WHERE order_id = :order_id
            """),
            {'order_id': order_id}
        ).fetchone()
        
        if all_items_result.total_count == all_items_result.ready_count and order_result.status != 'ready':
            db.session.execute(
                text("UPDATE orders SET status = 'ready', updated_at = CURRENT_TIMESTAMP WHERE id = :order_id"),
                {'order_id': order_id}
            )
        
        db.session.commit()
        
        print(f"Order item status updated successfully")
        
        # Get updated order data
        updated_order = db.session.execute(
            text("SELECT * FROM orders WHERE id = :order_id"),
            {'order_id': order_id}
        ).fetchone()
        
        # Get order items
        items_result = db.session.execute(
            text("SELECT * FROM order_items WHERE order_id = :order_id ORDER BY created_at"),
            {'order_id': order_id}
        ).fetchall()
        
        # Convert to dict format
        order_dict = dict(updated_order._mapping)
        order_dict['id'] = str(order_dict['id'])
        
        items_dict = []
        for item in items_result:
            item_dict = dict(item._mapping)
            item_dict['id'] = str(item_dict['id'])
            item_dict['order_id'] = str(item_dict['order_id'])
            item_dict['menu_item_id'] = str(item_dict['menu_item_id'])
            items_dict.append(item_dict)
        
        order_dict['items'] = items_dict
        
        return jsonify({
            'success': True,
            'message': 'Order item status updated successfully',
            'data': order_dict
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in update_order_item_status: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Error updating order item status',
            'error': str(e)
        }), 500


@order_bp.route('/<string:order_id>', methods=['DELETE'])
def delete_order(order_id):
    """Delete order"""
    try:
        order = Order.query.get(order_id)
        
        if not order:
            return jsonify({
                'success': False,
                'message': 'Order not found'
            }), 404
        
        # Only allow deletion of cancelled orders or very recent orders
        if order.status not in ['pending', 'cancelled']:
            return jsonify({
                'success': False,
                'message': 'Can only delete pending or cancelled orders'
            }), 400
        
        print(f"Deleting order: {order.order_number}")
        
        db.session.delete(order)
        db.session.commit()
        
        print(f"Order deleted successfully: {order.order_number}")
        
        return jsonify({
            'success': True,
            'message': 'Order deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in delete_order: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Error deleting order',
            'error': str(e)
        }), 500


@order_bp.route('/<string:order_id>/pay', methods=['POST'])
def pay_order(order_id):
    """Mark order as paid"""
    try:
        # Validate UUID format
        try:
            import uuid
            uuid.UUID(order_id)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid order ID format'
            }), 400
        
        # Find order using raw SQL (SQLite compatible)
        from sqlalchemy import text
        result = db.session.execute(
            text("SELECT * FROM orders WHERE id = :order_id"),
            {'order_id': order_id}
        ).fetchone()
        
        if not result:
            return jsonify({
                'success': False,
                'message': 'Order not found'
            }), 404
        
        # Check if order is in a payable status (ready or delivered)
        if result.status not in ['ready', 'delivered']:
            return jsonify({
                'success': False,
                'message': f'Order must be ready or delivered to be paid. Current status: {result.status}'
            }), 400
        
        data = request.json or {}
        payment_method = data.get('payment_method', 'cash')  # cash, card, or other
        payment_amount = data.get('payment_amount')
        
        # Validate payment amount if provided
        if payment_amount is not None:
            try:
                payment_amount = float(payment_amount)
                if payment_amount < float(result.final_amount):
                    return jsonify({
                        'success': False,
                        'message': f'Payment amount (€{payment_amount}) is less than order total (€{result.final_amount})'
                    }), 400
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Invalid payment amount'
                }), 400
        
        print(f"Processing payment for order {order_id} - Method: {payment_method}, Amount: €{result.final_amount}")
        
        # Update order status to payed
        db.session.execute(
            text("UPDATE orders SET status = 'payed', updated_at = CURRENT_TIMESTAMP WHERE id = :order_id"),
            {'order_id': order_id}
        )
        
        db.session.commit()
        
        print(f"Order marked as payed successfully")
        
        # Get updated order data
        updated_order = db.session.execute(
            text("SELECT * FROM orders WHERE id = :order_id"),
            {'order_id': order_id}
        ).fetchone()
        
        # Get order items
        items_result = db.session.execute(
            text("SELECT * FROM order_items WHERE order_id = :order_id ORDER BY created_at"),
            {'order_id': order_id}
        ).fetchall()
        
        # Convert to dict format
        order_dict = dict(updated_order._mapping)
        order_dict['id'] = str(order_dict['id'])
        
        items_dict = []
        for item in items_result:
            item_dict = dict(item._mapping)
            item_dict['id'] = str(item_dict['id'])
            item_dict['order_id'] = str(item_dict['order_id'])
            item_dict['menu_item_id'] = str(item_dict['menu_item_id'])
            items_dict.append(item_dict)
        
        order_dict['items'] = items_dict
        
        return jsonify({
            'success': True,
            'message': 'Payment processed successfully',
            'data': order_dict,
            'payment_info': {
                'method': payment_method,
                'amount': float(result.final_amount),
                'change': payment_amount - float(result.final_amount) if payment_amount else 0
            }
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in pay_order: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Error processing payment',
            'error': str(e)
        }), 500
