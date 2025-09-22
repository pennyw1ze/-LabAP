const amqp = require('amqplib');
const config = require('../config/config');

class MessageQueueService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.queues = {
      ORDER_CREATED: 'order_created',
      ORDER_UPDATED: 'order_updated',
      ORDER_CANCELLED: 'order_cancelled',
      INVENTORY_UPDATE: 'inventory_update',
      BILLING_REQUEST: 'billing_request'
    };
  }

  async connect() {
    try {
      this.connection = await amqp.connect(config.rabbitmq.url);
      this.channel = await this.connection.createChannel();
      
      // Declare queues
      for (const queueName of Object.values(this.queues)) {
        await this.channel.assertQueue(queueName, { durable: true });
      }
      
      console.log('✅ Connected to RabbitMQ');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error);
      return false;
    }
  }

  async publishMessage(queue, message) {
    try {
      if (!this.channel) {
        throw new Error('RabbitMQ channel not initialized');
      }

      const messageBuffer = Buffer.from(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString(),
        service: 'order-management'
      }));

      return this.channel.sendToQueue(queue, messageBuffer, { persistent: true });
    } catch (error) {
      console.error('Failed to publish message:', error);
      throw error;
    }
  }

  async publishOrderCreated(orderData) {
    return this.publishMessage(this.queues.ORDER_CREATED, {
      event: 'order_created',
      orderId: orderData.id,
      orderNumber: orderData.orderNumber,
      tableNumber: orderData.tableNumber,
      waiterId: orderData.waiterId,
      total: orderData.total,
      items: orderData.items
    });
  }

  async publishOrderUpdated(orderData) {
    return this.publishMessage(this.queues.ORDER_UPDATED, {
      event: 'order_updated',
      orderId: orderData.id,
      orderNumber: orderData.orderNumber,
      status: orderData.status,
      updatedAt: orderData.updatedAt
    });
  }

  async publishOrderCancelled(orderData) {
    return this.publishMessage(this.queues.ORDER_CANCELLED, {
      event: 'order_cancelled',
      orderId: orderData.id,
      orderNumber: orderData.orderNumber,
      reason: orderData.reason
    });
  }

  async publishInventoryUpdate(inventoryData) {
    return this.publishMessage(this.queues.INVENTORY_UPDATE, {
      event: 'inventory_update',
      orderId: inventoryData.orderId,
      items: inventoryData.items
    });
  }

  async publishBillingRequest(billingData) {
    return this.publishMessage(this.queues.BILLING_REQUEST, {
      event: 'billing_request',
      orderId: billingData.orderId,
      orderNumber: billingData.orderNumber,
      total: billingData.total,
      tableNumber: billingData.tableNumber
    });
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log('RabbitMQ connection closed');
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
    }
  }
}

module.exports = new MessageQueueService();