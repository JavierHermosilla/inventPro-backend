import { DataTypes, Model } from 'sequelize'

class Order extends Model {
  // 🔹 Inicialización del modelo
  static initialize (sequelize) {
    super.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        customerId: { type: DataTypes.UUID, allowNull: false },
        status: {
          type: DataTypes.ENUM('pending', 'processing', 'completed', 'cancelled'),
          defaultValue: 'pending',
          allowNull: false
        },
        totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
        stockRestored: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false }
      },
      {
        sequelize,
        modelName: 'Order',
        tableName: 'orders',
        timestamps: true,
        paranoid: true,
        indexes: [{ fields: ['customerId'] }, { fields: ['status'] }]
      }
    )
  }

  // 🔹 Relaciones
  // static associate (models, schema) {
  //   // Order -> User (cliente)
  //   this.belongsTo(models.User, { foreignKey: 'customerId', as: 'customerDetail', schema })

  //   // Order -> OrderProduct
  //   this.hasMany(models.OrderProduct, { foreignKey: 'orderId', as: 'orderItems', schema })
  // }
}

export default Order
