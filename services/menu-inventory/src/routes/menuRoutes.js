const express = require('express');
const MenuController = require('../controllers/menuController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     MenuItem:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - category
 *         - preparationTime
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the menu item
 *         name:
 *           type: string
 *           description: Name of the menu item
 *         description:
 *           type: string
 *           description: Description of the menu item
 *         price:
 *           type: number
 *           format: decimal
 *           description: Price of the menu item
 *         category:
 *           type: string
 *           enum: [appetizer, main, dessert, beverage, side]
 *           description: Category of the menu item
 *         isAvailable:
 *           type: boolean
 *           description: Availability status of the menu item
 *         preparationTime:
 *           type: integer
 *           description: Preparation time in minutes
 *         allergens:
 *           type: array
 *           items:
 *             type: string
 *           description: List of allergens
 *         nutritionalInfo:
 *           type: object
 *           description: Nutritional information
 */

/**
 * @swagger
 * /api/menu:
 *   get:
 *     summary: Get all menu items
 *     tags: [Menu]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [appetizer, main, dessert, beverage, side]
 *         description: Filter by category
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *         description: Filter by availability
 *     responses:
 *       200:
 *         description: List of menu items
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
 *                     $ref: '#/components/schemas/MenuItem'
 *                 count:
 *                   type: integer
 */
router.get('/', MenuController.getAllMenuItems);

/**
 * @swagger
 * /api/menu/available:
 *   get:
 *     summary: Get available menu items for ordering
 *     tags: [Menu]
 *     responses:
 *       200:
 *         description: List of available menu items
 */
router.get('/available', MenuController.getAvailableMenuItems);

/**
 * @swagger
 * /api/menu/{id}:
 *   get:
 *     summary: Get menu item by ID
 *     tags: [Menu]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Menu item details
 *       404:
 *         description: Menu item not found
 */
router.get('/:id', MenuController.getMenuItemById);

/**
 * @swagger
 * /api/menu:
 *   post:
 *     summary: Create a new menu item
 *     tags: [Menu]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MenuItem'
 *     responses:
 *       201:
 *         description: Menu item created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', MenuController.createMenuItem);

/**
 * @swagger
 * /api/menu/{id}:
 *   put:
 *     summary: Update menu item
 *     tags: [Menu]
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
 *             $ref: '#/components/schemas/MenuItem'
 *     responses:
 *       200:
 *         description: Menu item updated successfully
 *       404:
 *         description: Menu item not found
 */
router.put('/:id', MenuController.updateMenuItem);

/**
 * @swagger
 * /api/menu/{id}:
 *   delete:
 *     summary: Delete menu item
 *     tags: [Menu]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Menu item deleted successfully
 *       404:
 *         description: Menu item not found
 */
router.delete('/:id', MenuController.deleteMenuItem);

module.exports = router;