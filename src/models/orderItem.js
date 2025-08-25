import { DataTypes } from 'sequelize'
import sequelize from '../config/db.js'
import Product from './product.model.js'
import Order from './order.model.js'

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'order_items',
  timestamps: true
})

// Relaciones
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' })

export default OrderItem
