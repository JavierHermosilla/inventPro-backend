// src/models/order.model.js
import { DataTypes, Model } from 'sequelize'

class Order extends Model {
  static initialize (sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },

        // Cliente final de negocio
        clientId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'client_id',
          validate: { notEmpty: { msg: 'clientId es requerido' } }
        },

        status: {
          type: DataTypes.ENUM('pending', 'processing', 'completed', 'cancelled'),
          allowNull: false,
          defaultValue: 'pending'
        },

        totalAmount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          field: 'total_amount',
          validate: {
            isDecimal: { msg: 'totalAmount debe ser decimal' },
            min: { args: [0], msg: 'totalAmount no puede ser negativo' }
          }
        },

        stockRestored: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: 'stock_restored'
        },

        isBackorder: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: 'is_backorder'
        }
      },
      {
        sequelize,
        modelName: 'Order',
        tableName: 'orders',
        schema: 'inventpro_user',

        // Auditoría y naming
        timestamps: true,
        paranoid: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at'

        // ❌ sin "indexes" aquí; van en migraciones
      }
    )
  }

  static associate (models) {
    // ejemplo (ajusta al nombre real de tu modelo cliente):
    // Order.belongsTo(models.Client, {
    //   as: 'client',
    //   foreignKey: { name: 'clientId', field: 'client_id', allowNull: false }
    // })
  }
}

export default Order
