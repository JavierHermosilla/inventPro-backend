// src/models/product.model.js
import { DataTypes, Model } from 'sequelize'

class Product extends Model {
  static initialize (sequelize) {
    Product.init({
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
      sequelize,
      modelName: 'Product',
      tableName: 'products',
      timestamps: true,
      paranoid: true,
      deletedAt: 'deleted_at'
    })
  }

  static associate (models) {
    // Relación con Category
    Product.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' })
    // Relación con Supplier (antes era User)
    Product.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'supplier' })
  }
}

export default Product
