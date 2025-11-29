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

        // 🔗 FK al cliente de negocio (puede quedar NULL si borras al cliente)
        clientId: {
          type: DataTypes.UUID,
          allowNull: true, // <- debe ser true para ON DELETE SET NULL
          field: 'client_id',
          references: { model: 'clients', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
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
          // Getter para que venga como número (y no string) al serializar
          get () {
            const v = this.getDataValue('totalAmount')
            return v == null ? null : Number(v)
          },
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

        // Auditoría y naming
        timestamps: true,
        paranoid: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at'

        // 👉 índices y constraints complejas en migraciones, no aquí
      }
    )
  }

  static associate (models) {
    // Cliente (si lo borras → SET NULL)
    this.belongsTo(models.Client, {
      as: 'client',
      foreignKey: { name: 'clientId', field: 'client_id', allowNull: true },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    })

    // Items de la orden
    this.hasMany(models.OrderProduct, {
      as: 'items',
      foreignKey: { name: 'orderId', field: 'order_id', allowNull: false },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    })
  }
}

export default Order
