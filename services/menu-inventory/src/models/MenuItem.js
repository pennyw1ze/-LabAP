const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MenuItem = sequelize.define('MenuItem', {
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
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: 0
    }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['appetizer', 'main', 'dessert', 'beverage', 'side']]
    }
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  preparationTime: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    },
    comment: 'Preparation time in minutes'
  },
  allergens: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  nutritionalInfo: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'menu_items',
  timestamps: true,
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['isAvailable']
    }
  ]
});

module.exports = MenuItem;