const express = require('express');
const InventoryController = require('../controllers/inventoryController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     InventoryItem:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - unit
 *         - minimumStock
 *         - maximumStock
 *         - unitCost
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the inventory item
 *         name:
 *           type: string
 *           description: Name of the inventory item
 *         category:
 *           type: string
 *           enum: [meat, vegetables, dairy, grains, spices, beverages, other]
 *           description: Category of the inventory item
 *         unit:
 *           type: string
 *           enum: [kg, g, l, ml, pieces, cups]
 *           description: Unit of measurement
 *         currentStock:
 *           type: number
 *           format: decimal
 *           description: Current stock level
 *         minimumStock:
 *           type: number
 *           format: decimal
 *           description: Minimum stock threshold
 *         maximumStock:
 *           type: number
 *           format: decimal
 *           description: Maximum stock capacity
 *         unitCost:
 *           type: number
 *           format: decimal
 *           description: Cost per unit
 *         supplier:
 *           type: string
 *           description: Supplier name
 *         expirationDate:
 *           type: string
 *           format: date
 *           description: Expiration date
 *         lastRestocked:
 *           type: string
 *           format: date
 *           description: Last restocked date
 */

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Get all inventory items
 *     tags: [Inventory]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [meat, vegetables, dairy, grains, spices, beverages, other]
 *         description: Filter by category
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Filter items with low stock
 *     responses:
 *       200:
 *         description: List of inventory items
 */
router.get('/', InventoryController.getAllInventoryItems);

/**
 * @swagger
 * /api/inventory/alerts/low-stock:
 *   get:
 *     summary: Get low stock alerts
 *     tags: [Inventory]
 *     responses:
 *       200:
 *         description: List of items with low stock
 */
router.get('/alerts/low-stock', InventoryController.getLowStockAlerts);

/**
 * @swagger
 * /api/inventory/{id}:
 *   get:
 *     summary: Get inventory item by ID
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Inventory item details
 *       404:
 *         description: Inventory item not found
 */
router.get('/:id', InventoryController.getInventoryItemById);

/**
 * @swagger
 * /api/inventory:
 *   post:
 *     summary: Create a new inventory item
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InventoryItem'
 *     responses:
 *       201:
 *         description: Inventory item created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', InventoryController.createInventoryItem);

/**
 * @swagger
 * /api/inventory/{id}:
 *   put:
 *     summary: Update inventory item
 *     tags: [Inventory]
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
 *             $ref: '#/components/schemas/InventoryItem'
 *     responses:
 *       200:
 *         description: Inventory item updated successfully
 *       404:
 *         description: Inventory item not found
 */
router.put('/:id', InventoryController.updateInventoryItem);

/**
 * @swagger
 * /api/inventory/{id}/stock:
 *   patch:
 *     summary: Update stock levels (add or subtract)
 *     tags: [Inventory]
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
 *             required:
 *               - quantity
 *               - operation
 *             properties:
 *               quantity:
 *                 type: number
 *                 description: Quantity to add or subtract
 *               operation:
 *                 type: string
 *                 enum: [add, subtract]
 *                 description: Operation to perform
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *       400:
 *         description: Invalid operation or insufficient stock
 *       404:
 *         description: Inventory item not found
 */
router.patch('/:id/stock', InventoryController.updateStock);

/**
 * @swagger
 * /api/inventory/{id}:
 *   delete:
 *     summary: Delete inventory item
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Inventory item deleted successfully
 *       404:
 *         description: Inventory item not found
 */
router.delete('/:id', InventoryController.deleteInventoryItem);

module.exports = router;