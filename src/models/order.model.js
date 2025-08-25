import { DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'Customer ID is required' }
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false,
    validate: {
      notNull: { msg: 'Order status is required' }
    }
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notNull: { msg: 'Total amount is required' },
      isDecimal: { msg: 'Total amount must be a decimal value' },
      min: { args: [0], msg: 'Total amount cannot be negative' }
    }
  },
  stockRestored: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, {
  tableName: 'orders',
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      fields: ['customerId']
    },
    {
      fields: ['status']
    }
  ]
})

// relaciones
Order.associate = (models) => {
  Order.belongsTo(models.User, { foreignKey: 'customerId', as: 'customer' })

  Order.hasMany(models.OrderItem, { foreignKey: 'orderId', as: 'products' })
}

export default Order
