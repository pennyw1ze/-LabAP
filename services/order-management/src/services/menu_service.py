import requests
from flask import current_app

class MenuService:
    @staticmethod
    def get_menu_item(menu_item_id):
        """Get menu item details from menu service"""
        try:
            url = f"{current_app.config['MENU_SERVICE_URL']}/api/menu/{menu_item_id}"
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                return response.json().get('data')
            elif response.status_code == 404:
                return None
            else:
                raise Exception(f"Menu service returned status {response.status_code}")
                
        except requests.RequestException as e:
            raise Exception(f"Failed to communicate with menu service: {str(e)}")

    @staticmethod
    def get_available_menu_items():
        """Get available menu items from menu service"""
        try:
            url = f"{current_app.config['MENU_SERVICE_URL']}/api/menu/available"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                return response.json().get('data', [])
            else:
                raise Exception(f"Menu service returned status {response.status_code}")
                
        except requests.RequestException as e:
            raise Exception(f"Failed to communicate with menu service: {str(e)}")

    @staticmethod
    def validate_menu_items(menu_items):
        """Validate that menu items exist and are available"""
        try:
            available_items = MenuService.get_available_menu_items()
            available_item_ids = {item['id'] for item in available_items}
            
            invalid_items = []
            for item in menu_items:
                if item['menu_item_id'] not in available_item_ids:
                    invalid_items.append(item['menu_item_id'])
            
            return invalid_items
            
        except Exception as e:
            raise Exception(f"Failed to validate menu items: {str(e)}")