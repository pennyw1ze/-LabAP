from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import desc
from datetime import datetime, timedelta
import uuid

from models import db, Order, OrderItem
from services.menu_service import MenuService
from services.inventory_service import InventoryService
from services.message_queue_service import mq_service

order_bp = Blueprint('orders', __name__)

@order_bp.route('/', methods=['GET'])
def get_orders():
    """Get all orders with optional filtering"""
    try:
        # Get query parameters
        status = request.args.get('status')
        table_number = request.args.get('table_number')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        limit = request.args.get('limit', 50, type=int)
        
        # Base query
        query = Order.query
        
        # Apply filters
        if status:
            if status == 'active':
                query = query.filter(Order.status.in_(['pending', 'confirmed', 'preparing']))
            else:
                query = query.filter(Order.status == status)
                
        if table_number:
            query = query.filter(Order.table_number == table_number)
            
        if date_from:
            try:
                date_from = datetime.fromisoformat(date_from)
                query = query.filter(Order.created_at >= date_from)
            except ValueError:
                pass
                
        if date_to:
            try:
                date_to = datetime.fromisoformat(date_to)
                query = query.filter(Order.created_at <= date_to)
            except ValueError:
                pass
        
        # Order by creation time (newest first) and apply limit
        orders = query.order_by(desc(Order.created_at)).limit(limit).all()
        
        return jsonify({
            'success': True,
            'data': [order.to_dict() for order in orders],
            'count': len(orders)
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting orders: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error retrieving orders: {str(e)}'
        }), 500

@order_bp.route('/<order_id>', methods=['GET'])
def get_order(order_id):
    """Get specific order by ID"""
    try:
        order = Order.query.get_or_404(order_id)
        
        return jsonify({
            'success': True,
            'data': order.to_dict()
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting order {order_id}: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error retrieving order: {str(e)}'
        }), 500

@order_bp.route('/', methods=['POST'])
def create_order():
    """Create a new order"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['table_number', 'items']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        if not data['items']:
            return jsonify({
                'success': False,
                'message': 'Order must contain at least one item'
            }), 400
        
        # Validate menu items and check availability
        menu_items_to_validate = [{'menu_item_id': str(item['menu_item_id'])} for item in data['items']]
        invalid_items = MenuService.validate_menu_items(menu_items_to_validate)
        
        if invalid_items:
            return jsonify({
                'success': False,
                'message': f'Invalid or unavailable menu items: {invalid_items}'
            }), 400
        
        # Check inventory availability for the order
        temp_order_items = []
        for item_data in data['items']:
            menu_item = MenuService.get_menu_item(item_data['menu_item_id'])
            if not menu_item:
                return jsonify({
                    'success': False,
                    'message': f'Menu item not found: {item_data["menu_item_id"]}'
                }), 400
            
            # Create temporary order item for availability check
            temp_item = type('OrderItem', (), {
                'menu_item_id': item_data['menu_item_id'],
                'menu_item_name': menu_item['name'],
                'quantity': int(item_data['quantity'])
            })
            temp_order_items.append(temp_item)
        
        # Check if we have enough inventory to fulfill the order
        try:
            availability_check = InventoryService.check_availability_for_order(temp_order_items)
            if not availability_check['can_fulfill_order']:
                unavailable_items = availability_check['unavailable_items']
                return jsonify({
                    'success': False,
                    'message': 'Insufficient inventory for order',
                    'unavailable_items': unavailable_items
                }), 400
        except Exception as e:
            current_app.logger.warning(f"Could not check inventory availability: {str(e)}")
            # Continue with order creation but log the warning
        
        # Generate order number
        order_number = f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Calculate estimated completion time
        total_prep_time = 0
        total_amount = 0
        
        # Create order
        order = Order(
            order_number=order_number,
            table_number=data['table_number'],
            customer_name=data.get('customer_name'),
            order_type=data.get('order_type', 'dine_in'),
            special_instructions=data.get('special_instructions'),
            status='pending'
        )
        
        db.session.add(order)
        db.session.flush()  # Get the order ID
        
        # Create order items
        for item_data in data['items']:
            # Get menu item details
            menu_item = MenuService.get_menu_item(item_data['menu_item_id'])
            if not menu_item:
                return jsonify({
                    'success': False,
                    'message': f'Menu item not found: {item_data["menu_item_id"]}'
                }), 400
            
            unit_price = float(menu_item['price'])
            quantity = int(item_data['quantity'])
            total_price = unit_price * quantity
            
            order_item = OrderItem(
                order_id=order.id,
                menu_item_id=item_data['menu_item_id'],
                menu_item_name=menu_item['name'],
                quantity=quantity,
                unit_price=unit_price,
                total_price=total_price,
                special_instructions=item_data.get('special_instructions')
            )
            
            db.session.add(order_item)
            
            total_amount += total_price
            total_prep_time = max(total_prep_time, menu_item.get('preparation_time', 15))
        
        # Update order totals and estimated time
        order.total_amount = total_amount
        order.tax_amount = total_amount * 0.10  # 10% tax
        order.final_amount = order.total_amount + order.tax_amount
        
        # Calculate estimated completion time (base prep time + 10 minutes buffer)
        estimated_time = datetime.utcnow() + timedelta(minutes=total_prep_time + 10)
        order.estimated_completion_time = estimated_time
        
        db.session.commit()
        
        # Publish order event to message queue
        try:
            mq_service.publish_order_event('created', order.to_dict())
        except Exception as mq_error:
            current_app.logger.warning(f"Failed to publish order event: {str(mq_error)}")
        
        current_app.logger.info(f"Created order {order.order_number} for table {order.table_number}")
        
        return jsonify({
            'success': True,
            'data': order.to_dict(),
            'message': f'Order {order.order_number} created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating order: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error creating order: {str(e)}'
        }), 500

@order_bp.route('/<order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    """Update order status"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({
                'success': False,
                'message': 'Status is required'
            }), 400
        
        valid_statuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']
        if new_status not in valid_statuses:
            return jsonify({
                'success': False,
                'message': f'Invalid status. Must be one of: {valid_statuses}'
            }), 400
        
        order = Order.query.get_or_404(order_id)
        old_status = order.status
        order.status = new_status
        order.updated_at = datetime.utcnow()
        
        # If order is confirmed, reduce inventory
        if new_status == 'confirmed' and old_status == 'pending':
            try:
                InventoryService.reduce_inventory_for_order(order.items)
                current_app.logger.info(f"Inventory reduced for confirmed order {order.order_number}")
            except Exception as e:
                current_app.logger.error(f"Failed to reduce inventory for order {order.order_number}: {str(e)}")
                # Don't fail the order update, but log the error
                # In a production system, you might want to implement compensation logic
        
        # If order is confirmed, update all items to confirmed
        if new_status == 'confirmed':
            for item in order.items:
                if item.status == 'pending':
                    item.status = 'pending'  # Items stay pending until individually started
        
        # If order is preparing, update pending items to preparing
        elif new_status == 'preparing':
            for item in order.items:
                if item.status == 'pending':
                    item.status = 'preparing'
        
        # If order is ready, update all items to ready
        elif new_status == 'ready':
            for item in order.items:
                if item.status in ['pending', 'preparing']:
                    item.status = 'ready'
        
        db.session.commit()
        
        # Publish status update event
        try:
            mq_service.publish_order_event('status_updated', {
                **order.to_dict(),
                'previous_status': old_status,
                'new_status': new_status
            })
        except Exception as mq_error:
            current_app.logger.warning(f"Failed to publish status update event: {str(mq_error)}")
        
        current_app.logger.info(f"Order {order.order_number} status updated: {old_status} -> {new_status}")
        
        return jsonify({
            'success': True,
            'data': order.to_dict(),
            'message': f'Order status updated to {new_status}'
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating order status: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error updating order status: {str(e)}'
        }), 500

@order_bp.route('/<order_id>/items/<item_id>/status', methods=['PUT'])
def update_order_item_status(order_id, item_id):
    """Update individual order item status"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({
                'success': False,
                'message': 'Status is required'
            }), 400
        
        valid_statuses = ['pending', 'preparing', 'ready', 'served', 'cancelled']
        if new_status not in valid_statuses:
            return jsonify({
                'success': False,
                'message': f'Invalid status. Must be one of: {valid_statuses}'
            }), 400
        
        order = Order.query.get_or_404(order_id)
        order_item = OrderItem.query.filter_by(id=item_id, order_id=order_id).first_or_404()
        
        old_status = order_item.status
        order_item.status = new_status
        order_item.updated_at = datetime.utcnow()
        
        # Update order updated_at timestamp
        order.updated_at = datetime.utcnow()
        
        # Check if all items are ready and update order status accordingly
        if new_status == 'ready':
            all_items_ready = all(item.status in ['ready', 'served'] for item in order.items)
            if all_items_ready and order.status != 'ready':
                order.status = 'ready'
        
        db.session.commit()
        
        # Publish item status update event
        try:
            mq_service.publish_order_event('item_status_updated', {
                'order_id': str(order.id),
                'order_number': order.order_number,
                'item_id': str(order_item.id),
                'item_name': order_item.menu_item_name,
                'previous_status': old_status,
                'new_status': new_status,
                'table_number': order.table_number
            })
        except Exception as mq_error:
            current_app.logger.warning(f"Failed to publish item status update event: {str(mq_error)}")
        
        current_app.logger.info(f"Order item {order_item.menu_item_name} in order {order.order_number} status updated: {old_status} -> {new_status}")
        
        return jsonify({
            'success': True,
            'data': order.to_dict(),
            'message': f'Item status updated to {new_status}'
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating order item status: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error updating order item status: {str(e)}'
        }), 500

@order_bp.route('/analytics', methods=['GET'])
def get_order_analytics():
    """Get order analytics and statistics"""
    try:
        # Get date range from query params
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        if not date_from:
            date_from = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        else:
            date_from = datetime.fromisoformat(date_from)
            
        if not date_to:
            date_to = datetime.utcnow()
        else:
            date_to = datetime.fromisoformat(date_to)
        
        # Base query for the date range
        base_query = Order.query.filter(
            Order.created_at >= date_from,
            Order.created_at <= date_to
        )
        
        # Calculate statistics
        total_orders = base_query.count()
        completed_orders = base_query.filter(Order.status == 'delivered').count()
        cancelled_orders = base_query.filter(Order.status == 'cancelled').count()
        active_orders = base_query.filter(Order.status.in_(['pending', 'confirmed', 'preparing'])).count()
        
        # Revenue statistics
        revenue_query = base_query.filter(Order.status == 'delivered')
        total_revenue = sum([float(order.final_amount) for order in revenue_query.all()])
        
        # Average order value
        avg_order_value = total_revenue / completed_orders if completed_orders > 0 else 0
        
        # Orders by status
        orders_by_status = {}
        for status in ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']:
            count = base_query.filter(Order.status == status).count()
            orders_by_status[status] = count
        
        # Popular items (top 10)
        item_query = db.session.query(
            OrderItem.menu_item_name,
            db.func.sum(OrderItem.quantity).label('total_quantity'),
            db.func.sum(OrderItem.total_price).label('total_revenue')
        ).join(Order).filter(
            Order.created_at >= date_from,
            Order.created_at <= date_to,
            Order.status != 'cancelled'
        ).group_by(OrderItem.menu_item_name).order_by(
            db.func.sum(OrderItem.quantity).desc()
        ).limit(10)
        
        popular_items = []
        for item_name, quantity, revenue in item_query.all():
            popular_items.append({
                'item_name': item_name,
                'total_quantity': int(quantity),
                'total_revenue': float(revenue)
            })
        
        # Orders by hour (for today)
        if date_from.date() == datetime.utcnow().date():
            orders_by_hour = {}
            for hour in range(24):
                hour_start = date_from.replace(hour=hour)
                hour_end = hour_start.replace(hour=hour + 1) if hour < 23 else date_to
                
                count = base_query.filter(
                    Order.created_at >= hour_start,
                    Order.created_at < hour_end
                ).count()
                
                orders_by_hour[f"{hour:02d}:00"] = count
        else:
            orders_by_hour = {}
        
        return jsonify({
            'success': True,
            'data': {
                'date_range': {
                    'from': date_from.isoformat(),
                    'to': date_to.isoformat()
                },
                'summary': {
                    'total_orders': total_orders,
                    'completed_orders': completed_orders,
                    'cancelled_orders': cancelled_orders,
                    'active_orders': active_orders,
                    'total_revenue': round(total_revenue, 2),
                    'average_order_value': round(avg_order_value, 2)
                },
                'orders_by_status': orders_by_status,
                'popular_items': popular_items,
                'orders_by_hour': orders_by_hour
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting order analytics: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error retrieving analytics: {str(e)}'
        }), 500

@order_bp.route('/kitchen', methods=['GET'])
def get_kitchen_orders():
    """Get orders specifically for kitchen display"""
    try:
        # Get only active orders (not delivered or cancelled)
        orders = Order.query.filter(
            Order.status.in_(['pending', 'confirmed', 'preparing', 'ready'])
        ).order_by(Order.created_at.asc()).all()
        
        return jsonify({
            'success': True,
            'data': [order.to_dict() for order in orders],
            'count': len(orders)
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting kitchen orders: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error retrieving kitchen orders: {str(e)}'
        }), 500