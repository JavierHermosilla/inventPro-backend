import { DataTypes, Model } from 'sequelize'

class ManualInventory extends Model {
  static initialize (sequelize) {
    ManualInventory.init({
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      productId: { type: DataTypes.UUID, allowNull: false },
      userId: { type: DataTypes.UUID, allowNull: false },
      type: { type: DataTypes.ENUM('increase', 'decrease'), allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      reason: { type: DataTypes.STRING(255), allowNull: true }
    }, {
      sequelize,
      tableName: 'manual_inventories',
      timestamps: true
    })
  }
}

export default ManualInventory
