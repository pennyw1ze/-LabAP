from flask import Blueprint, request, jsonify
import requests
from flask import current_app

gateway_bp = Blueprint('gateway', __name__)

def proxy_request(service_url, path, method='GET', data=None, params=None):
    """Proxy request to a microservice"""
    try:
        url = f"{service_url}{path}"
        timeout = current_app.config.get('REQUEST_TIMEOUT', 30)
        
        if method == 'GET':
            response = requests.get(url, params=params, timeout=timeout)
        elif method == 'POST':
            response = requests.post(url, json=data, timeout=timeout)
        elif method == 'PUT':
            response = requests.put(url, json=data, timeout=timeout)
        elif method == 'PATCH':
            response = requests.patch(url, json=data, timeout=timeout)
        elif method == 'DELETE':
            response = requests.delete(url, timeout=timeout)
        else:
            return jsonify({'success': False, 'message': 'Method not allowed'}), 405
        
        return response.json(), response.status_code
        
    except requests.RequestException as e:
        return {
            'success': False,
            'message': 'Service unavailable',
            'error': str(e)
        }, 503

# Menu Service Routes
@gateway_bp.route('/menu', methods=['GET'])
@gateway_bp.route('/menu/', methods=['GET'])
def get_menu_items():
    """Get all menu items"""
    response_data, status_code = proxy_request(
        current_app.config['MENU_SERVICE_URL'],
        '/api/menu',
        method='GET',
        params=request.args
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/menu/available', methods=['GET'])
def get_available_menu_items():
    """Get available menu items"""
    response_data, status_code = proxy_request(
        current_app.config['MENU_SERVICE_URL'],
        '/api/menu/available',
        method='GET'
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/menu/<menu_id>', methods=['GET'])
def get_menu_item(menu_id):
    """Get specific menu item"""
    response_data, status_code = proxy_request(
        current_app.config['MENU_SERVICE_URL'],
        f'/api/menu/{menu_id}',
        method='GET'
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/menu', methods=['POST'])
def create_menu_item():
    """Create new menu item"""
    response_data, status_code = proxy_request(
        current_app.config['MENU_SERVICE_URL'],
        '/api/menu',
        method='POST',
        data=request.json
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/menu/<menu_id>', methods=['PUT'])
def update_menu_item(menu_id):
    """Update menu item"""
    response_data, status_code = proxy_request(
        current_app.config['MENU_SERVICE_URL'],
        f'/api/menu/{menu_id}',
        method='PUT',
        data=request.json
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/menu/<menu_id>', methods=['DELETE'])
def delete_menu_item(menu_id):
    """Delete menu item"""
    response_data, status_code = proxy_request(
        current_app.config['MENU_SERVICE_URL'],
        f'/api/menu/{menu_id}',
        method='DELETE'
    )
    return jsonify(response_data), status_code

# Inventory Routes
@gateway_bp.route('/inventory/', methods=['GET'])
@gateway_bp.route('/inventory', methods=['GET'])
def get_inventory_items():
    """Get all inventory items"""
    response_data, status_code = proxy_request(
        current_app.config['MENU_SERVICE_URL'],
        '/api/inventory/',
        method='GET',
        params=request.args
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/inventory/<item_id>', methods=['GET'])
def get_inventory_item(item_id):
    """Get specific inventory item"""
    response_data, status_code = proxy_request(
        current_app.config['MENU_SERVICE_URL'],
        f'/api/inventory/{item_id}',
        method='GET'
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/inventory/', methods=['POST'])
@gateway_bp.route('/inventory', methods=['POST'])
def create_inventory_item():
    """Create new inventory item"""
    response_data, status_code = proxy_request(
        current_app.config['MENU_SERVICE_URL'],
        '/api/inventory/',
        method='POST',
        data=request.json
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/inventory/<item_id>', methods=['PUT'])
def update_inventory_item(item_id):
    """Update inventory item"""
    response_data, status_code = proxy_request(
        current_app.config['MENU_SERVICE_URL'],
        f'/api/inventory/{item_id}',
        method='PUT',
        data=request.json
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/inventory/<item_id>/adjust', methods=['POST'])
def adjust_inventory_stock(item_id):
    """Adjust inventory stock"""
    response_data, status_code = proxy_request(
        current_app.config['MENU_SERVICE_URL'],
        f'/api/inventory/{item_id}/adjust',
        method='POST',
        data=request.json
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/inventory/alerts', methods=['GET'])
def get_inventory_alerts():
    """Get inventory alerts"""
    response_data, status_code = proxy_request(
        current_app.config['MENU_SERVICE_URL'],
        '/api/inventory/alerts',
        method='GET'
    )
    return jsonify(response_data), status_code

# Order Service Routes
@gateway_bp.route('/orders', methods=['GET'])
def get_orders():
    """Get all orders"""
    response_data, status_code = proxy_request(
        current_app.config['ORDER_SERVICE_URL'],
        '/api/orders',
        method='GET',
        params=request.args
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/orders/<order_id>', methods=['GET'])
def get_order(order_id):
    """Get specific order"""
    response_data, status_code = proxy_request(
        current_app.config['ORDER_SERVICE_URL'],
        f'/api/orders/{order_id}',
        method='GET'
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/orders', methods=['POST'])
def create_order():
    """Create new order"""
    response_data, status_code = proxy_request(
        current_app.config['ORDER_SERVICE_URL'],
        '/api/orders',
        method='POST',
        data=request.json
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/orders/<order_id>', methods=['PUT'])
def update_order(order_id):
    """Update order"""
    response_data, status_code = proxy_request(
        current_app.config['ORDER_SERVICE_URL'],
        f'/api/orders/{order_id}',
        method='PUT',
        data=request.json
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/orders/<order_id>/status', methods=['PATCH'])
def update_order_status(order_id):
    """Update order status"""
    response_data, status_code = proxy_request(
        current_app.config['ORDER_SERVICE_URL'],
        f'/api/orders/{order_id}/status',
        method='PATCH',
        data=request.json
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/orders/<order_id>/cancel', methods=['POST'])
def cancel_order(order_id):
    """Cancel order"""
    response_data, status_code = proxy_request(
        current_app.config['ORDER_SERVICE_URL'],
        f'/api/orders/{order_id}/cancel',
        method='POST',
        data=request.json
    )
    return jsonify(response_data), status_code

# Billing Service Routes
@gateway_bp.route('/bills', methods=['GET'])
def get_bills():
    """Get all bills"""
    response_data, status_code = proxy_request(
        current_app.config['BILLING_SERVICE_URL'],
        '/api/bills',
        method='GET',
        params=request.args
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/bills/<bill_id>', methods=['GET'])
def get_bill(bill_id):
    """Get specific bill"""
    response_data, status_code = proxy_request(
        current_app.config['BILLING_SERVICE_URL'],
        f'/api/bills/{bill_id}',
        method='GET'
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/bills/order/<order_id>', methods=['GET'])
def get_bill_by_order(order_id):
    """Get bill by order ID"""
    response_data, status_code = proxy_request(
        current_app.config['BILLING_SERVICE_URL'],
        f'/api/bills/order/{order_id}',
        method='GET'
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/bills', methods=['POST'])
def create_bill():
    """Create new bill"""
    response_data, status_code = proxy_request(
        current_app.config['BILLING_SERVICE_URL'],
        '/api/bills',
        method='POST',
        data=request.json
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/payments', methods=['GET'])
def get_payments():
    """Get all payments"""
    response_data, status_code = proxy_request(
        current_app.config['BILLING_SERVICE_URL'],
        '/api/payments',
        method='GET',
        params=request.args
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/payments', methods=['POST'])
def process_payment():
    """Process payment"""
    response_data, status_code = proxy_request(
        current_app.config['BILLING_SERVICE_URL'],
        '/api/payments',
        method='POST',
        data=request.json
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/payments/<payment_id>', methods=['GET'])
def get_payment(payment_id):
    """Get specific payment"""
    response_data, status_code = proxy_request(
        current_app.config['BILLING_SERVICE_URL'],
        f'/api/payments/{payment_id}',
        method='GET'
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/reports/daily-summary', methods=['GET'])
def get_daily_billing_summary():
    """Get daily billing summary"""
    response_data, status_code = proxy_request(
        current_app.config['BILLING_SERVICE_URL'],
        '/api/reports/daily-summary',
        method='GET',
        params=request.args
    )
    return jsonify(response_data), status_code

# Analytics Service Routes
@gateway_bp.route('/analytics/dashboard', methods=['GET'])
def get_analytics_dashboard():
    """Get analytics dashboard"""
    response_data, status_code = proxy_request(
        current_app.config['ANALYTICS_SERVICE_URL'],
        '/api/analytics/dashboard',
        method='GET'
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/analytics/sales-report', methods=['GET'])
def get_sales_report():
    """Get sales report"""
    response_data, status_code = proxy_request(
        current_app.config['ANALYTICS_SERVICE_URL'],
        '/api/analytics/sales-report',
        method='GET',
        params=request.args
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/analytics/menu-performance', methods=['GET'])
def get_menu_performance():
    """Get menu performance analytics"""
    response_data, status_code = proxy_request(
        current_app.config['ANALYTICS_SERVICE_URL'],
        '/api/analytics/menu-performance',
        method='GET',
        params=request.args
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/analytics/order-trends', methods=['GET'])
def get_order_trends():
    """Get order trends"""
    response_data, status_code = proxy_request(
        current_app.config['ANALYTICS_SERVICE_URL'],
        '/api/analytics/order-trends',
        method='GET',
        params=request.args
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/analytics/financial-summary', methods=['GET'])
def get_financial_summary():
    """Get financial summary"""
    response_data, status_code = proxy_request(
        current_app.config['ANALYTICS_SERVICE_URL'],
        '/api/analytics/financial-summary',
        method='GET',
        params=request.args
    )
    return jsonify(response_data), status_code