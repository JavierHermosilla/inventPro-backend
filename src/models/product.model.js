import { DataTypes } from 'sequelize'
import sequelize from '../config/db.js'
import Category from './category.model.js'
import User from './user.model.js'

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notNull: { msg: 'Product name is required' },
      notEmpty: { msg: 'Product name cannot be empty' }
    }
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notNull: { msg: 'Product price is required' },
      min: { args: [0], msg: 'Price cannot be negative' }
    }
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      notNull: { msg: 'Stock is required' },
      min: { args: [0], msg: 'Stock cannot be negative' }
    }
  }
}, {
  tableName: 'products',
  timestamps: true,
  paranoid: true,
  deletedAt: 'deleted_at'
})

// Relaciones
Product.belongsTo(Category, { foreignKey: { name: 'categoryId', allowNull: false }, as: 'category' })
Product.belongsTo(User, { foreignKey: { name: 'supplierId', allowNull: false }, as: 'supplier' })

export default Product
