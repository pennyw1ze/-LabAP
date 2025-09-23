import requests
from flask import current_app

class OrderService:
    @staticmethod
    def get_order(order_id):
        """Get order details from order service"""
        try:
            url = f"{current_app.config['ORDER_SERVICE_URL']}/api/orders/{order_id}"
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                return response.json().get('data')
            elif response.status_code == 404:
                return None
            else:
                raise Exception(f"Order service returned status {response.status_code}")
                
        except requests.RequestException as e:
            raise Exception(f"Failed to communicate with order service: {str(e)}")

    @staticmethod
    def get_orders_by_status(status):
        """Get orders by status from order service"""
        try:
            url = f"{current_app.config['ORDER_SERVICE_URL']}/api/orders"
            params = {'status': status}
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                return response.json().get('data', [])
            else:
                raise Exception(f"Order service returned status {response.status_code}")
                
        except requests.RequestException as e:
            raise Exception(f"Failed to communicate with order service: {str(e)}")