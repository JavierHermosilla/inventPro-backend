// src/models/manualInventory.model.js
import { DataTypes, Model } from 'sequelize'

class ManualInventory extends Model {
  static initialize (sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },

        productId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'product_id',
          validate: { notEmpty: { msg: 'productId es requerido' } }
        },

        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'user_id',
          validate: { notEmpty: { msg: 'userId es requerido' } }
        },

        type: {
          type: DataTypes.ENUM('increase', 'decrease'),
          allowNull: false,
          validate: {
            isIn: { args: [['increase', 'decrease']], msg: 'type debe ser "increase" o "decrease"' }
          }
        },

        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: { isInt: true, min: 1 }
        },

        reason: {
          type: DataTypes.STRING(255),
          allowNull: true,
          set (value) {
            const v = value == null ? null : String(value).trim()
            this.setDataValue('reason', v || null)
          }
        }
      },
      {
        sequelize,
        modelName: 'ManualInventory',
        tableName: 'manual_inventories',
        schema: 'inventpro_user',

        timestamps: true,
        underscored: true,
        paranoid: false,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    )
  }

  static associate (models) {
    ManualInventory.belongsTo(models.Product, {
      as: 'product',
      foreignKey: { name: 'productId', field: 'product_id', allowNull: false }
    })
    ManualInventory.belongsTo(models.User, {
      as: 'user',
      foreignKey: { name: 'userId', field: 'user_id', allowNull: false }
    })
  }
}

export default ManualInventory
