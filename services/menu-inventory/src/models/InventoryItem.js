const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryItem = sequelize.define('InventoryItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['meat', 'vegetables', 'dairy', 'grains', 'spices', 'beverages', 'other']]
    }
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['kg', 'g', 'l', 'ml', 'pieces', 'cups']]
    }
  },
  currentStock: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  minimumStock: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  maximumStock: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  unitCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: 0
    }
  },
  supplier: {
    type: DataTypes.STRING,
    allowNull: true
  },
  expirationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastRestocked: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'inventory_items',
  timestamps: true,
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['currentStock']
    },
    {
      fields: ['expirationDate']
    }
  ]
});

module.exports = InventoryItem;