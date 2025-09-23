import requests
from flask import current_app

class DataService:
    @staticmethod
    def get_menu_items():
        """Get menu items from menu service"""
        try:
            url = f"{current_app.config['MENU_SERVICE_URL']}/api/menu"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                return response.json().get('data', [])
            else:
                raise Exception(f"Menu service returned status {response.status_code}")
                
        except requests.RequestException as e:
            raise Exception(f"Failed to communicate with menu service: {str(e)}")

    @staticmethod
    def get_orders(status=None, date_from=None, date_to=None):
        """Get orders from order service"""
        try:
            url = f"{current_app.config['ORDER_SERVICE_URL']}/api/orders"
            params = {}
            
            if status:
                params['status'] = status
            if date_from:
                params['date_from'] = date_from
            if date_to:
                params['date_to'] = date_to
            
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code == 200:
                return response.json().get('data', [])
            else:
                raise Exception(f"Order service returned status {response.status_code}")
                
        except requests.RequestException as e:
            raise Exception(f"Failed to communicate with order service: {str(e)}")

    @staticmethod
    def get_bills(status=None, date_from=None, date_to=None):
        """Get bills from billing service"""
        try:
            url = f"{current_app.config['BILLING_SERVICE_URL']}/api/bills"
            params = {}
            
            if status:
                params['status'] = status
            if date_from:
                params['date_from'] = date_from
            if date_to:
                params['date_to'] = date_to
            
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code == 200:
                return response.json().get('data', [])
            else:
                raise Exception(f"Billing service returned status {response.status_code}")
                
        except requests.RequestException as e:
            raise Exception(f"Failed to communicate with billing service: {str(e)}")

    @staticmethod
    def get_payments(date_from=None, date_to=None):
        """Get payments from billing service"""
        try:
            url = f"{current_app.config['BILLING_SERVICE_URL']}/api/payments"
            params = {}
            
            if date_from:
                params['date_from'] = date_from
            if date_to:
                params['date_to'] = date_to
            
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code == 200:
                return response.json().get('data', [])
            else:
                raise Exception(f"Billing service returned status {response.status_code}")
                
        except requests.RequestException as e:
            raise Exception(f"Failed to communicate with billing service: {str(e)}")