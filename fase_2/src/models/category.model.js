import { DataTypes, Model } from 'sequelize'

class Category extends Model {
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
            this.setDataValue('name', String(value ?? '').trim().toLowerCase())
          }
        },

        description: {
          type: DataTypes.STRING,
          allowNull: true,
          set (value) {
            const v = value == null ? null : String(value).trim()
            this.setDataValue('description', v || null)
          }
        }
      },
      {
        sequelize,
        modelName: 'Category',
        tableName: 'categories',

        timestamps: true,
        paranoid: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',

        indexes: [
          { unique: true, fields: ['name'] },
          { fields: ['created_at'] }
        ],

        hooks: {
          beforeCreate: (category) => {
            if (category.name) category.name = String(category.name).trim()
          },
          beforeUpdate: (category) => {
            if (category.name) category.name = String(category.name).trim()
          }
        }
      }
    )
  }
}

export default Category
