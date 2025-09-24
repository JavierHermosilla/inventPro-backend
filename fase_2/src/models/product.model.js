import { DataTypes, Model } from 'sequelize'

class Product extends Model {
  // 🔹 Inicialización del modelo
  static initialize (sequelize) {
    super.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            notNull: { msg: 'Product name is required' },
            notEmpty: { msg: 'Product name cannot be empty' }
          },
          set (value) {
            this.setDataValue('name', value?.trim() || '')
          }
        },
        description: {
          type: DataTypes.STRING,
          allowNull: true,
          set (value) {
            this.setDataValue('description', value?.trim() || '')
          }
        },
        price: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          validate: {
            notNull: { msg: 'Product price is required' },
            min: { args: [0], msg: 'Price cannot be negative' }
          }
        },
        stock: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          validate: {
            notNull: { msg: 'Stock is required' },
            isIInt: { msg: 'Stock musty be an integer' }
          }
        }
      },
      {
        sequelize,
        modelName: 'Product',
        tableName: 'products',
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at'
      }
    )
  }

  // 🔹 Relaciones
  // static associate (models, schema) {
  //   // Product -> Category
  //   this.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category', schema })

  //   // Product -> Supplier
  //   this.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'supplier', schema })

  //   // Product -> OrderProduct
  //   this.hasMany(models.OrderProduct, { foreignKey: 'productId', as: 'orderProducts', schema })

  //   // Product -> ManualInventory (1:N)
  //   this.hasMany(models.ManualInventory, { foreignKey: 'productId', as: 'inventoryAdjustments', schema })
  // }
}

export default Product
