const { MenuItem, InventoryItem } = require('../models');
const Joi = require('joi');

class MenuController {
  // Validation schemas
  static menuItemSchema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().allow('').optional(),
    price: Joi.number().min(0).required(),
    category: Joi.string().valid('appetizer', 'main', 'dessert', 'beverage', 'side').required(),
    isAvailable: Joi.boolean().optional(),
    preparationTime: Joi.number().integer().min(1).required(),
    allergens: Joi.array().items(Joi.string()).optional(),
    nutritionalInfo: Joi.object().optional()
  });

  static updateMenuItemSchema = Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    description: Joi.string().allow('').optional(),
    price: Joi.number().min(0).optional(),
    category: Joi.string().valid('appetizer', 'main', 'dessert', 'beverage', 'side').optional(),
    isAvailable: Joi.boolean().optional(),
    preparationTime: Joi.number().integer().min(1).optional(),
    allergens: Joi.array().items(Joi.string()).optional(),
    nutritionalInfo: Joi.object().optional()
  });

  // Get all menu items
  static async getAllMenuItems(req, res) {
    try {
      const { category, available } = req.query;
      const where = {};
      
      if (category) where.category = category;
      if (available !== undefined) where.isAvailable = available === 'true';

      const menuItems = await MenuItem.findAll({
        where,
        include: [{
          model: InventoryItem,
          as: 'ingredients',
          through: { attributes: ['quantity', 'unit'] }
        }],
        order: [['category'], ['name']]
      });

      res.json({
        success: true,
        data: menuItems,
        count: menuItems.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching menu items',
        error: error.message
      });
    }
  }

  // Get menu item by ID
  static async getMenuItemById(req, res) {
    try {
      const { id } = req.params;
      
      const menuItem = await MenuItem.findByPk(id, {
        include: [{
          model: InventoryItem,
          as: 'ingredients',
          through: { attributes: ['quantity', 'unit'] }
        }]
      });

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found'
        });
      }

      res.json({
        success: true,
        data: menuItem
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching menu item',
        error: error.message
      });
    }
  }

  // Create new menu item
  static async createMenuItem(req, res) {
    try {
      const { error, value } = MenuController.menuItemSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
      }

      const menuItem = await MenuItem.create(value);

      res.status(201).json({
        success: true,
        message: 'Menu item created successfully',
        data: menuItem
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating menu item',
        error: error.message
      });
    }
  }

  // Update menu item
  static async updateMenuItem(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = MenuController.updateMenuItemSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
      }

      const [updated] = await MenuItem.update(value, {
        where: { id },
        returning: true
      });

      if (updated === 0) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found'
        });
      }

      const updatedMenuItem = await MenuItem.findByPk(id);

      res.json({
        success: true,
        message: 'Menu item updated successfully',
        data: updatedMenuItem
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating menu item',
        error: error.message
      });
    }
  }

  // Delete menu item
  static async deleteMenuItem(req, res) {
    try {
      const { id } = req.params;
      
      const deleted = await MenuItem.destroy({
        where: { id }
      });

      if (deleted === 0) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found'
        });
      }

      res.json({
        success: true,
        message: 'Menu item deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting menu item',
        error: error.message
      });
    }
  }

  // Get available menu items (for ordering)
  static async getAvailableMenuItems(req, res) {
    try {
      const menuItems = await MenuItem.findAll({
        where: { isAvailable: true },
        include: [{
          model: InventoryItem,
          as: 'ingredients',
          through: { attributes: ['quantity', 'unit'] }
        }],
        order: [['category'], ['name']]
      });

      res.json({
        success: true,
        data: menuItems,
        count: menuItems.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching available menu items',
        error: error.message
      });
    }
  }
}

module.exports = MenuController;