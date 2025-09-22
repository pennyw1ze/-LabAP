const { Order, OrderItem } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const Joi = require('joi');
const menuService = require('../services/menuService');
const messageQueueService = require('../services/messageQueueService');

class OrderController {
  // Validation schemas
  static createOrderSchema = Joi.object({
    tableNumber: Joi.number().integer().min(1).max(100).required(),
    customerName: Joi.string().allow('').optional(),
    customerPhone: Joi.string().allow('').optional(),
    orderType: Joi.string().valid('dine-in', 'takeaway', 'delivery').optional(),
    waiterId: Joi.string().required(),
    waiterName: Joi.string().required(),
    notes: Joi.string().allow('').optional(),
    items: Joi.array().items(
      Joi.object({
        menuItemId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().min(1).required(),
        specialInstructions: Joi.string().allow('').optional()
      })
    ).min(1).required()
  });

  static updateOrderSchema = Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled').optional(),
    customerName: Joi.string().allow('').optional(),
    customerPhone: Joi.string().allow('').optional(),
    notes: Joi.string().allow('').optional()
  });

  // Generate unique order number
  static generateOrderNumber() {
    const now = new Date();
    const timestamp = now.getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `ORD${timestamp}${random}`;
  }

  // Get all orders
  static async getAllOrders(req, res) {
    try {
      const { status, waiterId, tableNumber, date } = req.query;
      const where = {};
      
      if (status) where.status = status;
      if (waiterId) where.waiterId = waiterId;
      if (tableNumber) where.tableNumber = parseInt(tableNumber);
      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        where.orderDate = {
          [Op.gte]: startDate,
          [Op.lt]: endDate
        };
      }

      const orders = await Order.findAll({
        where,
        include: [{
          model: OrderItem,
          as: 'items'
        }],
        order: [['orderDate', 'DESC']]
      });

      res.json({
        success: true,
        data: orders,
        count: orders.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching orders',
        error: error.message
      });
    }
  }

  // Get order by ID
  static async getOrderById(req, res) {
    try {
      const { id } = req.params;
      
      const order = await Order.findByPk(id, {
        include: [{
          model: OrderItem,
          as: 'items'
        }]
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching order',
        error: error.message
      });
    }
  }

  // Create new order
  static async createOrder(req, res) {
    try {
      const { error, value } = OrderController.createOrderSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
      }

      // Validate menu items and get their details
      const validatedItems = await menuService.validateMenuItems(value.items);
      
      // Calculate totals
      const subtotal = validatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const tax = subtotal * 0.1; // 10% tax rate
      const total = subtotal + tax;
      
      // Calculate estimated preparation time
      const estimatedPreparationTime = Math.max(...validatedItems.map(item => item.preparationTime));

      // Create order
      const orderData = {
        ...value,
        id: uuidv4(),
        orderNumber: OrderController.generateOrderNumber(),
        subtotal,
        tax,
        total,
        estimatedPreparationTime,
        status: 'pending'
      };

      const order = await Order.create(orderData);

      // Create order items
      const orderItems = validatedItems.map(item => ({
        ...item,
        orderId: order.id
      }));

      await OrderItem.bulkCreate(orderItems);

      // Fetch complete order with items
      const completeOrder = await Order.findByPk(order.id, {
        include: [{
          model: OrderItem,
          as: 'items'
        }]
      });

      // Publish order created event
      try {
        await messageQueueService.publishOrderCreated(completeOrder);
      } catch (mqError) {
        console.error('Failed to publish order created event:', mqError);
      }

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: completeOrder
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating order',
        error: error.message
      });
    }
  }

  // Update order status
  static async updateOrder(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = OrderController.updateOrderSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
      }

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Handle status transitions
      const updateData = { ...value };
      
      if (value.status) {
        switch (value.status) {
          case 'confirmed':
            updateData.confirmedAt = new Date();
            break;
          case 'ready':
            updateData.readyAt = new Date();
            break;
          case 'served':
            updateData.servedAt = new Date();
            break;
        }
      }

      await order.update(updateData);

      // Publish order updated event
      try {
        await messageQueueService.publishOrderUpdated(order);
      } catch (mqError) {
        console.error('Failed to publish order updated event:', mqError);
      }

      res.json({
        success: true,
        message: 'Order updated successfully',
        data: order
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating order',
        error: error.message
      });
    }
  }

  // Cancel order
  static async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      if (['served', 'cancelled'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel order with status: ${order.status}`
        });
      }

      await order.update({ 
        status: 'cancelled',
        notes: order.notes ? `${order.notes}\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`
      });

      // Publish order cancelled event
      try {
        await messageQueueService.publishOrderCancelled({ ...order.toJSON(), reason });
      } catch (mqError) {
        console.error('Failed to publish order cancelled event:', mqError);
      }

      res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: order
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error cancelling order',
        error: error.message
      });
    }
  }

  // Get orders by table
  static async getOrdersByTable(req, res) {
    try {
      const { tableNumber } = req.params;
      
      const orders = await Order.findAll({
        where: { tableNumber: parseInt(tableNumber) },
        include: [{
          model: OrderItem,
          as: 'items'
        }],
        order: [['orderDate', 'DESC']]
      });

      res.json({
        success: true,
        data: orders,
        count: orders.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching orders by table',
        error: error.message
      });
    }
  }

  // Get orders by waiter
  static async getOrdersByWaiter(req, res) {
    try {
      const { waiterId } = req.params;
      
      const orders = await Order.findAll({
        where: { waiterId },
        include: [{
          model: OrderItem,
          as: 'items'
        }],
        order: [['orderDate', 'DESC']]
      });

      res.json({
        success: true,
        data: orders,
        count: orders.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching orders by waiter',
        error: error.message
      });
    }
  }
}

module.exports = OrderController;