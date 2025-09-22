const { InventoryItem } = require('../models');
const Joi = require('joi');

class InventoryController {
  // Validation schemas
  static inventoryItemSchema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    category: Joi.string().valid('meat', 'vegetables', 'dairy', 'grains', 'spices', 'beverages', 'other').required(),
    unit: Joi.string().valid('kg', 'g', 'l', 'ml', 'pieces', 'cups').required(),
    currentStock: Joi.number().min(0).optional(),
    minimumStock: Joi.number().min(0).required(),
    maximumStock: Joi.number().min(0).required(),
    unitCost: Joi.number().min(0).required(),
    supplier: Joi.string().allow('').optional(),
    expirationDate: Joi.date().optional(),
    lastRestocked: Joi.date().optional()
  });

  static updateInventoryItemSchema = Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    category: Joi.string().valid('meat', 'vegetables', 'dairy', 'grains', 'spices', 'beverages', 'other').optional(),
    unit: Joi.string().valid('kg', 'g', 'l', 'ml', 'pieces', 'cups').optional(),
    currentStock: Joi.number().min(0).optional(),
    minimumStock: Joi.number().min(0).optional(),
    maximumStock: Joi.number().min(0).optional(),
    unitCost: Joi.number().min(0).optional(),
    supplier: Joi.string().allow('').optional(),
    expirationDate: Joi.date().optional(),
    lastRestocked: Joi.date().optional()
  });

  // Get all inventory items
  static async getAllInventoryItems(req, res) {
    try {
      const { category, lowStock } = req.query;
      const where = {};
      
      if (category) where.category = category;

      const inventoryItems = await InventoryItem.findAll({
        where,
        order: [['category'], ['name']]
      });

      let filteredItems = inventoryItems;
      
      // Filter for low stock items if requested
      if (lowStock === 'true') {
        filteredItems = inventoryItems.filter(item => 
          parseFloat(item.currentStock) <= parseFloat(item.minimumStock)
        );
      }

      res.json({
        success: true,
        data: filteredItems,
        count: filteredItems.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching inventory items',
        error: error.message
      });
    }
  }

  // Get inventory item by ID
  static async getInventoryItemById(req, res) {
    try {
      const { id } = req.params;
      
      const inventoryItem = await InventoryItem.findByPk(id);

      if (!inventoryItem) {
        return res.status(404).json({
          success: false,
          message: 'Inventory item not found'
        });
      }

      res.json({
        success: true,
        data: inventoryItem
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching inventory item',
        error: error.message
      });
    }
  }

  // Create new inventory item
  static async createInventoryItem(req, res) {
    try {
      const { error, value } = InventoryController.inventoryItemSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
      }

      // Validate that maximum stock is greater than minimum stock
      if (value.maximumStock <= value.minimumStock) {
        return res.status(400).json({
          success: false,
          message: 'Maximum stock must be greater than minimum stock'
        });
      }

      const inventoryItem = await InventoryItem.create(value);

      res.status(201).json({
        success: true,
        message: 'Inventory item created successfully',
        data: inventoryItem
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating inventory item',
        error: error.message
      });
    }
  }

  // Update inventory item
  static async updateInventoryItem(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = InventoryController.updateInventoryItemSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message)
        });
      }

      const inventoryItem = await InventoryItem.findByPk(id);
      if (!inventoryItem) {
        return res.status(404).json({
          success: false,
          message: 'Inventory item not found'
        });
      }

      // Validate stock levels if they are being updated
      const minimumStock = value.minimumStock || inventoryItem.minimumStock;
      const maximumStock = value.maximumStock || inventoryItem.maximumStock;
      
      if (maximumStock <= minimumStock) {
        return res.status(400).json({
          success: false,
          message: 'Maximum stock must be greater than minimum stock'
        });
      }

      await inventoryItem.update(value);

      res.json({
        success: true,
        message: 'Inventory item updated successfully',
        data: inventoryItem
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating inventory item',
        error: error.message
      });
    }
  }

  // Delete inventory item
  static async deleteInventoryItem(req, res) {
    try {
      const { id } = req.params;
      
      const deleted = await InventoryItem.destroy({
        where: { id }
      });

      if (deleted === 0) {
        return res.status(404).json({
          success: false,
          message: 'Inventory item not found'
        });
      }

      res.json({
        success: true,
        message: 'Inventory item deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting inventory item',
        error: error.message
      });
    }
  }

  // Update stock levels (restock/consume)
  static async updateStock(req, res) {
    try {
      const { id } = req.params;
      const { quantity, operation } = req.body;

      if (!quantity || !operation) {
        return res.status(400).json({
          success: false,
          message: 'Quantity and operation are required'
        });
      }

      if (!['add', 'subtract'].includes(operation)) {
        return res.status(400).json({
          success: false,
          message: 'Operation must be either "add" or "subtract"'
        });
      }

      const inventoryItem = await InventoryItem.findByPk(id);
      if (!inventoryItem) {
        return res.status(404).json({
          success: false,
          message: 'Inventory item not found'
        });
      }

      let newStock = parseFloat(inventoryItem.currentStock);
      
      if (operation === 'add') {
        newStock += parseFloat(quantity);
        // Update last restocked date when adding stock
        await inventoryItem.update({
          currentStock: newStock,
          lastRestocked: new Date()
        });
      } else {
        newStock -= parseFloat(quantity);
        
        if (newStock < 0) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient stock available'
          });
        }
        
        await inventoryItem.update({ currentStock: newStock });
      }

      res.json({
        success: true,
        message: `Stock ${operation}ed successfully`,
        data: inventoryItem
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating stock',
        error: error.message
      });
    }
  }

  // Get low stock alerts
  static async getLowStockAlerts(req, res) {
    try {
      const inventoryItems = await InventoryItem.findAll();
      
      const lowStockItems = inventoryItems.filter(item => 
        parseFloat(item.currentStock) <= parseFloat(item.minimumStock)
      );

      res.json({
        success: true,
        data: lowStockItems,
        count: lowStockItems.length,
        message: lowStockItems.length > 0 ? 'Low stock items found' : 'All items are adequately stocked'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching low stock alerts',
        error: error.message
      });
    }
  }
}

module.exports = InventoryController;