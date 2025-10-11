// src/models/orderProduct.model.js
import { DataTypes, Model } from 'sequelize'

class OrderProduct extends Model {
  static initialize (sequelize) {
    super.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

        orderId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'order_id',
          validate: { notEmpty: { msg: 'orderId es requerido' } }
        },

        productId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'product_id',
          validate: { notEmpty: { msg: 'productId es requerido' } }
        },

        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            isInt: { msg: 'quantity debe ser entero' },
            min: { args: [1], msg: 'quantity debe ser ≥ 1' }
          }
        },

        // Snapshot del precio al momento de crear la línea
        price: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0, // ← alinea con la migración (DEFAULT 0 NOT NULL)
          validate: {
            isDecimal: { msg: 'price debe ser decimal' },
            min: { args: [0], msg: 'price no puede ser negativo' }
          }
        }
      },
      {
        sequelize,
        modelName: 'OrderProduct',
        tableName: 'order_products',
        // No es necesario poner schema aquí porque ya lo fuerzas en config.define.schema
        timestamps: true,
        paranoid: false,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',

        // (Opcional pero útil): Evitar que cambien el snapshot luego
        hooks: {
          beforeUpdate (instance) {
            if (instance.changed('price')) {
              throw new Error('price es inmutable después de creado')
            }
          }
        }
      }
    )
  }

  static associate (models) {
    OrderProduct.belongsTo(models.Order, {
      as: 'order',
      foreignKey: { name: 'orderId', field: 'order_id', allowNull: false }
    })
    OrderProduct.belongsTo(models.Product, {
      as: 'product',
      foreignKey: { name: 'productId', field: 'product_id', allowNull: false }
    })
  }
}

export default OrderProduct
