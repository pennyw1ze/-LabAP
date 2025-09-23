import pika
import json
from flask import current_app

class MessageQueueService:
    def __init__(self):
        self.connection = None
        self.channel = None

    def connect(self):
        """Connect to RabbitMQ"""
        try:
            parameters = pika.URLParameters(current_app.config['RABBITMQ_URL'])
            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()
            
            # Declare exchanges and queues
            self.setup_queues()
            
        except Exception as e:
            current_app.logger.error(f"Failed to connect to RabbitMQ: {str(e)}")
            raise

    def setup_queues(self):
        """Set up queues and exchanges"""
        # Order events exchange
        self.channel.exchange_declare(exchange='order_events', exchange_type='topic')
        
        # Order status updates queue
        self.channel.queue_declare(queue='order_status_updates', durable=True)
        self.channel.queue_bind(exchange='order_events', queue='order_status_updates', routing_key='order.status.*')
        
        # Kitchen orders queue
        self.channel.queue_declare(queue='kitchen_orders', durable=True)
        self.channel.queue_bind(exchange='order_events', queue='kitchen_orders', routing_key='order.created')

    def publish_order_event(self, event_type, order_data):
        """Publish order event to message queue"""
        try:
            if not self.connection or self.connection.is_closed:
                self.connect()
            
            routing_key = f"order.{event_type}"
            message = {
                'event_type': event_type,
                'timestamp': order_data.get('updated_at'),
                'data': order_data
            }
            
            self.channel.basic_publish(
                exchange='order_events',
                routing_key=routing_key,
                body=json.dumps(message),
                properties=pika.BasicProperties(delivery_mode=2)  # Make message persistent
            )
            
            current_app.logger.info(f"Published order event: {event_type} for order {order_data.get('order_number')}")
            
        except Exception as e:
            current_app.logger.error(f"Failed to publish order event: {str(e)}")
            # Don't raise exception to avoid breaking the main flow

    def close(self):
        """Close connection to RabbitMQ"""
        if self.connection and not self.connection.is_closed:
            self.connection.close()

# Global instance
mq_service = MessageQueueService()