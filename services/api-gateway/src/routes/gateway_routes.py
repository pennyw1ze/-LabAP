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

@gateway_bp.route('/orders/<order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    """Update order status"""
    response_data, status_code = proxy_request(
        current_app.config['ORDER_SERVICE_URL'],
        f'/api/orders/{order_id}/status',
        method='PUT',
        data=request.json
    )
    return jsonify(response_data), status_code

@gateway_bp.route('/orders/<order_id>/items/<item_id>/status', methods=['PUT'])
def update_order_item_status(order_id, item_id):
    """Update order item status"""
    response_data, status_code = proxy_request(
        current_app.config['ORDER_SERVICE_URL'],
        f'/api/orders/{order_id}/items/{item_id}/status',
        method='PUT',
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
