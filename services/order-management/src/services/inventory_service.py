import requests
from flask import current_app

class InventoryService:
    @staticmethod
    def reduce_inventory_for_order(order_items):
        """Reduce inventory stock when an order is confirmed"""
        try:
            # For each order item, get the required ingredients and reduce stock
            for item in order_items:
                InventoryService._reduce_inventory_for_menu_item(
                    item.menu_item_id, 
                    item.quantity
                )
            
        except Exception as e:
            current_app.logger.error(f"Failed to reduce inventory for order: {str(e)}")
            raise Exception(f"Inventory reduction failed: {str(e)}")

    @staticmethod
    def _reduce_inventory_for_menu_item(menu_item_id, quantity):
        """Reduce inventory for a specific menu item"""
        try:
            # Get menu ingredients from menu-inventory service
            menu_service_url = current_app.config['MENU_SERVICE_URL']
            ingredients_url = f"{menu_service_url}/api/menu/{menu_item_id}/ingredients"
            
            response = requests.get(ingredients_url, timeout=10)
            
            if response.status_code == 200:
                ingredients_data = response.json().get('data', {})
                ingredients = ingredients_data.get('ingredients', [])
                
                # For each ingredient, reduce the stock
                for ingredient in ingredients:
                    inventory_item_id = ingredient['inventory_item']['id']
                    required_quantity = ingredient['quantity'] * quantity
                    adjustment = -required_quantity  # Negative to reduce stock
                    
                    InventoryService._adjust_inventory_stock(inventory_item_id, adjustment)
                    
            elif response.status_code == 404:
                current_app.logger.warning(f"No ingredients found for menu item {menu_item_id}")
            else:
                raise Exception(f"Menu service returned status {response.status_code}")
                
        except requests.RequestException as e:
            raise Exception(f"Failed to communicate with menu service: {str(e)}")

    @staticmethod
    def _adjust_inventory_stock(inventory_item_id, adjustment):
        """Adjust inventory stock via menu-inventory service"""
        try:
            menu_service_url = current_app.config['MENU_SERVICE_URL']
            adjust_url = f"{menu_service_url}/api/inventory/{inventory_item_id}/adjust"
            
            response = requests.post(
                adjust_url,
                json={'adjustment': adjustment},
                timeout=5
            )
            
            if response.status_code != 200:
                data = response.json()
                raise Exception(f"Inventory adjustment failed: {data.get('message', 'Unknown error')}")
                
            current_app.logger.info(f"Adjusted inventory {inventory_item_id} by {adjustment}")
            
        except requests.RequestException as e:
            raise Exception(f"Failed to adjust inventory: {str(e)}")

    @staticmethod
    def check_availability_for_order(order_items):
        """Check if all items in an order can be prepared based on current inventory"""
        try:
            menu_item_ids = [item.menu_item_id for item in order_items]
            
            menu_service_url = current_app.config['MENU_SERVICE_URL']
            availability_url = f"{menu_service_url}/api/menu/check-availability"
            
            response = requests.post(
                availability_url,
                json={'menu_item_ids': menu_item_ids},
                timeout=10
            )
            
            if response.status_code == 200:
                availability_data = response.json().get('data', [])
                
                # Check if all items can be prepared considering quantities
                unavailable_items = []
                for item in order_items:
                    item_availability = next(
                        (a for a in availability_data if a['menu_item']['id'] == item.menu_item_id),
                        None
                    )
                    
                    if not item_availability:
                        unavailable_items.append({
                            'menu_item_name': item.menu_item_name,
                            'quantity': item.quantity,
                            'reason': 'Piatto non trovato nel menu'
                        })
                        continue
                    
                    # Check if we have enough for the requested quantity
                    # The availability check from menu service already considers single portion
                    # We need to multiply by the order quantity
                    missing_ingredients = []
                    
                    if item_availability.get('missing_ingredients'):
                        # If even one portion can't be made, it's unavailable
                        for ingredient in item_availability['missing_ingredients']:
                            missing_ingredients.append(ingredient['name'])
                    else:
                        # Check if we have enough for ALL requested quantities
                        for ingredient in item_availability.get('required_ingredients', []):
                            required_total = ingredient['required_quantity'] * item.quantity
                            if ingredient['available_quantity'] < required_total:
                                missing_ingredients.append(ingredient['name'])
                    
                    if missing_ingredients:
                        unavailable_items.append({
                            'menu_item_name': item.menu_item_name,
                            'quantity': item.quantity,
                            'reason': f'Ingredienti insufficienti per {item.quantity} porzioni: {", ".join(set(missing_ingredients))}'
                        })
                
                return {
                    'can_fulfill_order': len(unavailable_items) == 0,
                    'unavailable_items': unavailable_items
                }
                
            else:
                raise Exception(f"Menu service returned status {response.status_code}")
                
        except requests.RequestException as e:
            raise Exception(f"Failed to check availability: {str(e)}")

    @staticmethod
    def get_inventory_alerts():
        """Get current inventory alerts"""
        try:
            menu_service_url = current_app.config['MENU_SERVICE_URL']
            alerts_url = f"{menu_service_url}/api/inventory/alerts"
            
            response = requests.get(alerts_url, timeout=5)
            
            if response.status_code == 200:
                return response.json().get('data', {})
            else:
                raise Exception(f"Menu service returned status {response.status_code}")
                
        except requests.RequestException as e:
            current_app.logger.warning(f"Failed to get inventory alerts: {str(e)}")
            return {}