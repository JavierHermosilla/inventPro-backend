// src/models/product.model.js
import { DataTypes, Model } from 'sequelize'

class Product extends Model {
  static initialize (sequelize) {
    super.init(
      {
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
          },
          set (value) {
            this.setDataValue('name', String(value ?? '').trim())
          }
        },

        description: {
          type: DataTypes.STRING,
          allowNull: true,
          set (value) {
            const v = value == null ? null : String(value).trim()
            this.setDataValue('description', v || null)
          }
        },

        price: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          validate: {
            notNull: { msg: 'Product price is required' },
            isDecimal: { msg: 'Price must be a decimal value' },
            min: { args: [0], msg: 'Price cannot be negative' }
          }
        },

        // ✅ Stock puede ser negativo (backorder / traslado desde otra sucursal)
        stock: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          validate: {
            notNull: { msg: 'Stock is required' },
            isInt: { msg: 'Stock must be an integer' }
            // ⛔️ Quitar cualquier min: 0
          }
        }
      },
      {
        sequelize,
        modelName: 'Product',
        tableName: 'products',

        timestamps: true,
        paranoid: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',

        indexes: [
          { unique: true, fields: ['name'] },
          { fields: ['price'] },
          { fields: ['stock'] }
        ]
      }
    )
  }
}

export default Product
