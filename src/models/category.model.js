import { DataTypes, Model } from 'sequelize'

class Category extends Model {
  // 🔹 Inicialización del modelo
  static initialize (sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: { name: 'unique_category_name', msg: 'Nombre de categoría ya registrado' },
          validate: {
            notNull: { msg: 'El nombre de la categoría es obligatorio' },
            notEmpty: { msg: 'El nombre de la categoría no puede estar vacío' }
          },
          set (value) {
            this.setDataValue('name', value?.trim().toLowerCase() || '')
          }
        },
        description: {
          type: DataTypes.STRING,
          allowNull: true,
          set (value) {
            this.setDataValue('description', value?.trim() || '')
          }
        }
      },
      {
        sequelize,
        modelName: 'Category',
        tableName: 'categories',
        timestamps: true,
        paranoid: true,
        indexes: [{ unique: true, fields: ['name'] }],
        hooks: {
          beforeCreate: (category) => { category.name = category.name.trim() },
          beforeUpdate: (category) => { category.name = category.name.trim() }
        }
      }
    )
  }

  // 🔹 Definición de relaciones
  // static associate (models, schema) {
  //   // Uno a muchos: Category -> Product
  //   this.hasMany(models.Product, { foreignKey: 'categoryId', as: 'categoryProducts', schema })

  //   // Muchos a muchos: Category <-> Supplier
  //   this.belongsToMany(models.Supplier, {
  //     through: { model: 'SupplierCategories', schema }, // tabla intermedia normalizada
  //     as: 'suppliedBy', // alias según tabla de normalización
  //     foreignKey: 'categoryId'
  //   })
  // }
}

export default Category
