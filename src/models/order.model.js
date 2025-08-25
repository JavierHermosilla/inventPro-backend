import { DataTypes, Model } from 'sequelize'

class Order extends Model {
  static initialize (sequelize) {
    Order.init({
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      customerId: { type: DataTypes.UUID, allowNull: false },
      status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false
      },
      totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      stockRestored: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false }
    }, {
      sequelize,
      tableName: 'orders',
      timestamps: true,
      paranoid: true,
      indexes: [
        { fields: ['customerId'] },
        { fields: ['status'] }
      ]
    })
  }

  static associate (models) {
    Order.belongsTo(models.User, { foreignKey: 'customerId', as: 'customer' })
    Order.hasMany(models.OrderItem, { foreignKey: 'orderId', as: 'products' })
  }
}

export default Order
