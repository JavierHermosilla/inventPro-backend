import { DataTypes, Model } from 'sequelize'

class ManualInventory extends Model {
  // 🔹 Inicialización del modelo
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
          allowNull: false
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false
        },
        type: {
          type: DataTypes.ENUM('increase', 'decrease'),
          allowNull: false,
          validate: {
            isIn: {
              args: [['increase', 'decrease']],
              msg: 'El tipo debe ser "increase" o "decrease"'
            }
          }
        },
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: { min: 1 }
        },
        reason: {
          type: DataTypes.STRING(255),
          allowNull: true,
          set (value) {
            this.setDataValue('reason', value?.trim() || null)
          }
        }
      },
      {
        sequelize,
        modelName: 'ManualInventory',
        tableName: 'manual_inventories',
        timestamps: true,
        paranoid: true
      }
    )
  }

  // 🔹 Definición de relaciones
  static associate (models, schema) {
    // ManualInventory -> Product
    this.belongsTo(models.Product, { foreignKey: 'productId', as: 'product', schema })

    // ManualInventory -> User
    this.belongsTo(models.User, { foreignKey: 'userId', as: 'performedBy', schema })
  }
}

export default ManualInventory
