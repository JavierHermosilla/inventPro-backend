import { DataTypes, Model } from 'sequelize'

class OrderItem extends Model {
  static initialize (sequelize) {
    OrderItem.init({
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      orderId: { type: DataTypes.UUID, allowNull: false },
      productId: { type: DataTypes.UUID, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
    }, {
      sequelize,
      tableName: 'order_items',
      timestamps: true
    })
  }

  static associate (models) {
    OrderItem.belongsTo(models.Product, { foreignKey: 'productId', as: 'product' })
    OrderItem.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' })
  }
}

export default OrderItem
