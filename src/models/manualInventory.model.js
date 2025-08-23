import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const ManualInventory = sequelize.define('ManualInventory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'Product ID is required' }
    }
  },
  type: {
    type: DataTypes.ENUM('increase', 'decrease'),
    allowNull: false,
    validate: {
      notNull: { msg: 'Type is required' },
      isIn: { args: [['increase', 'decrease']], msg: 'Type must be increase or decrease' }
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: 'Quantity is required' },
      isInt: { msg: 'Quantity must be an integer' },
      min: { args: [1], msg: 'Quantity must be at least 1' }
    }
  },
  reason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: {
        args: [0, 255],
        msg: 'Reason must be at most 255 characters long'
      }
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'User ID is required' }
    }
  }
}, {
  tableName: 'manual_inventories',
  timestamps: true,
  indexes: [
    { fields: ['productId', 'userId'] }
  ]
})

// relaciones
ManualInventory.associate = (models) => {
  ManualInventory.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' })
  ManualInventory.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
}

export default ManualInventory
