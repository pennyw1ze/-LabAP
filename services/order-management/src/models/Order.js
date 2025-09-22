const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  tableNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 100
    }
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  customerPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled']]
    }
  },
  orderType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'dine-in',
    validate: {
      isIn: [['dine-in', 'takeaway', 'delivery']]
    }
  },
  waiterId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  waiterName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estimatedPreparationTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Estimated preparation time in minutes'
  },
  orderDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  confirmedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  readyAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  servedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true,
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['tableNumber']
    },
    {
      fields: ['waiterId']
    },
    {
      fields: ['orderDate']
    },
    {
      fields: ['orderNumber'],
      unique: true
    }
  ]
});

module.exports = Order;