const axios = require('axios');
const config = require('../config/config');

class MenuService {
  constructor() {
    this.baseURL = config.services.menuService;
  }

  async getMenuItem(menuItemId) {
    try {
      const response = await axios.get(`${this.baseURL}/api/menu/${menuItemId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching menu item ${menuItemId}:`, error.message);
      throw new Error('Menu item not found or service unavailable');
    }
  }

  async getAvailableMenuItems() {
    try {
      const response = await axios.get(`${this.baseURL}/api/menu/available`);
      return response.data;
    } catch (error) {
      console.error('Error fetching available menu items:', error.message);
      throw new Error('Menu service unavailable');
    }
  }

  async validateMenuItems(items) {
    try {
      const validatedItems = [];
      
      for (const item of items) {
        const menuItemResponse = await this.getMenuItem(item.menuItemId);
        
        if (!menuItemResponse.success) {
          throw new Error(`Menu item ${item.menuItemId} not found`);
        }
        
        const menuItem = menuItemResponse.data;
        
        if (!menuItem.isAvailable) {
          throw new Error(`Menu item ${menuItem.name} is not available`);
        }
        
        validatedItems.push({
          ...item,
          menuItemName: menuItem.name,
          unitPrice: menuItem.price,
          preparationTime: menuItem.preparationTime,
          totalPrice: parseFloat(menuItem.price) * item.quantity
        });
      }
      
      return validatedItems;
    } catch (error) {
      console.error('Error validating menu items:', error.message);
      throw error;
    }
  }
}

module.exports = new MenuService();