import { DataTypes, Model } from 'sequelize'

class OrderProduct extends Model {
  static initialize (sequelize) {
    super.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        orderId: { type: DataTypes.UUID, allowNull: false },
        productId: { type: DataTypes.UUID, allowNull: false },
        quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
        price: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
      },
      {
        sequelize,
        modelName: 'OrderProduct',
        tableName: 'order_products',
        timestamps: true
      }
    )
  }

  static associate (models, schema) {
    // OrderProduct -> Order
    this.belongsTo(models.Order, { foreignKey: 'orderId', as: 'parentOrder', schema })

    // OrderProduct -> Product
    this.belongsTo(models.Product, { foreignKey: 'productId', as: 'orderedProduct', schema })
  }
}

export default OrderProduct
