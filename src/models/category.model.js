import { DataTypes, Model } from 'sequelize'

class Category extends Model {
  static initialize (sequelize) {
    Category.init({
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
        set (value) { this.setDataValue('name', value?.trim().toLowerCase() || '') }
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
        set (value) { this.setDataValue('description', value?.trim() || '') }
      }
    }, {
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
    })
  }

  static associate (models) {
    // Uno a muchos: Category -> Product
    Category.hasMany(models.Product, { foreignKey: 'categoryId', as: 'products' })
    // Muchos a muchos: Category <-> Supplier
    Category.belongsToMany(models.Supplier, {
      through: 'SupplierCategories',
      as: 'suppliers',
      foreignKey: 'categoryId'
    })
  }
}

export default Category
