const express = require('express');
const OrderController = require('../controllers/orderController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       required:
 *         - tableNumber
 *         - waiterId
 *         - waiterName
 *         - items
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the order
 *         orderNumber:
 *           type: string
 *           description: Human-readable order number
 *         tableNumber:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           description: Table number
 *         customerName:
 *           type: string
 *           description: Customer name (optional)
 *         customerPhone:
 *           type: string
 *           description: Customer phone (optional)
 *         status:
 *           type: string
 *           enum: [pending, confirmed, preparing, ready, served, cancelled]
 *           description: Order status
 *         orderType:
 *           type: string
 *           enum: [dine-in, takeaway, delivery]
 *           description: Type of order
 *         waiterId:
 *           type: string
 *           description: ID of the waiter handling the order
 *         waiterName:
 *           type: string
 *           description: Name of the waiter handling the order
 *         subtotal:
 *           type: number
 *           format: decimal
 *           description: Subtotal amount
 *         tax:
 *           type: number
 *           format: decimal
 *           description: Tax amount
 *         total:
 *           type: number
 *           format: decimal
 *           description: Total amount
 *         notes:
 *           type: string
 *           description: Special notes for the order
 *         estimatedPreparationTime:
 *           type: integer
 *           description: Estimated preparation time in minutes
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *     OrderItem:
 *       type: object
 *       required:
 *         - menuItemId
 *         - quantity
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         menuItemId:
 *           type: string
 *           format: uuid
 *           description: ID of the menu item
 *         menuItemName:
 *           type: string
 *           description: Name of the menu item
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Quantity ordered
 *         unitPrice:
 *           type: number
 *           format: decimal
 *           description: Price per unit
 *         totalPrice:
 *           type: number
 *           format: decimal
 *           description: Total price for this item
 *         status:
 *           type: string
 *           enum: [pending, confirmed, preparing, ready, served]
 *           description: Status of this order item
 *         specialInstructions:
 *           type: string
 *           description: Special instructions for this item
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, preparing, ready, served, cancelled]
 *         description: Filter by order status
 *       - in: query
 *         name: waiterId
 *         schema:
 *           type: string
 *         description: Filter by waiter ID
 *       - in: query
 *         name: tableNumber
 *         schema:
 *           type: integer
 *         description: Filter by table number
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by order date
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 count:
 *                   type: integer
 */
router.get('/', OrderController.getAllOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 */
router.get('/:id', OrderController.getOrderById);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tableNumber
 *               - waiterId
 *               - waiterName
 *               - items
 *             properties:
 *               tableNumber:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *               customerName:
 *                 type: string
 *               customerPhone:
 *                 type: string
 *               orderType:
 *                 type: string
 *                 enum: [dine-in, takeaway, delivery]
 *               waiterId:
 *                 type: string
 *               waiterName:
 *                 type: string
 *               notes:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - menuItemId
 *                     - quantity
 *                   properties:
 *                     menuItemId:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                     specialInstructions:
 *                       type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', OrderController.createOrder);

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Update order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, preparing, ready, served, cancelled]
 *               customerName:
 *                 type: string
 *               customerPhone:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       404:
 *         description: Order not found
 */
router.put('/:id', OrderController.updateOrder);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     summary: Cancel order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Cannot cancel order in current status
 *       404:
 *         description: Order not found
 */
router.post('/:id/cancel', OrderController.cancelOrder);

/**
 * @swagger
 * /api/orders/table/{tableNumber}:
 *   get:
 *     summary: Get orders by table number
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: tableNumber
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of orders for the table
 */
router.get('/table/:tableNumber', OrderController.getOrdersByTable);

/**
 * @swagger
 * /api/orders/waiter/{waiterId}:
 *   get:
 *     summary: Get orders by waiter ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: waiterId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of orders for the waiter
 */
router.get('/waiter/:waiterId', OrderController.getOrdersByWaiter);

module.exports = router;