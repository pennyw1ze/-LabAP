# services/billing-payments/src/services/order_update_service.py
import requests
from flask import current_app

class OrderUpdateService:
    @staticmethod
    def mark_order_as_billed(order_id):
        """
        Notify order service that a bill has been created for this order.
        This is optional but helps track the order lifecycle.
        """
        try:
            # You could add a custom status or metadata to the order
            # For now, we just log it
            current_app.logger.info(f"Bill created for order {order_id}")
            
            # Optionally, you could update order status or add metadata
            # url = f"{current_app.config['ORDER_SERVICE_URL']}/api/orders/{order_id}/metadata"
            # response = requests.patch(url, json={'billed': True}, timeout=5)
            
            return True
            
        except Exception as e:
            current_app.logger.error(f"Failed to notify order service about billing: {str(e)}")
            return False

    @staticmethod
    def mark_order_as_paid(order_id):
        """
        Mark order as paid in the order service.
        This can trigger additional business logic.
        """
        try:
            url = f"{current_app.config['ORDER_SERVICE_URL']}/api/orders/{order_id}/status"
            
            # Check current order status first
            order_response = requests.get(
                f"{current_app.config['ORDER_SERVICE_URL']}/api/orders/{order_id}",
                timeout=5
            )
            
            if order_response.status_code == 200:
                order = order_response.json().get('data')
                
                # Only update if order is in delivered status
                if order.get('status') == 'delivered':
                    response = requests.put(
                        url,
                        json={'status': 'completed'},
                        headers={'Content-Type': 'application/json'},
                        timeout=5
                    )
                    
                    if response.status_code == 200:
                        current_app.logger.info(f"Order {order_id} marked as completed (paid)")
                        return True
                    else:
                        current_app.logger.warning(f"Failed to update order status: {response.status_code}")
                        
            return False
            
        except requests.RequestException as e:
            current_app.logger.error(f"Failed to update order status: {str(e)}")
            return False