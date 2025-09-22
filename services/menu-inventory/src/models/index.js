const MenuItem = require('./MenuItem');
const InventoryItem = require('./InventoryItem');

// Define associations
// A menu item can use multiple inventory items (many-to-many relationship)
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MenuItemInventory = sequelize.define('MenuItemInventory', {
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'menu_item_inventory',
  timestamps: true
});

// Define associations
MenuItem.belongsToMany(InventoryItem, { 
  through: MenuItemInventory,
  as: 'ingredients',
  foreignKey: 'menuItemId'
});

InventoryItem.belongsToMany(MenuItem, { 
  through: MenuItemInventory,
  as: 'usedInMenuItems',
  foreignKey: 'inventoryItemId'
});

module.exports = {
  MenuItem,
  InventoryItem,
  MenuItemInventory,
  sequelize
};