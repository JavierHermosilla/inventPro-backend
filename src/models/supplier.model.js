// src/models/supplier.model.js
import { DataTypes, Model } from 'sequelize'

class Supplier extends Model {
  static initialize (sequelize) {
    Supplier.init({
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false, unique: true },
      contactName: { type: DataTypes.STRING, allowNull: true },
      email: { type: DataTypes.STRING, allowNull: true, validate: { isEmail: { msg: 'Invalid email' } } },
      phone: { type: DataTypes.STRING, allowNull: true, validate: { is: { args: /^\+?\d{7,15}$/, msg: 'Phone must be valid' } } },
      address: { type: DataTypes.STRING, allowNull: true },
      website: { type: DataTypes.STRING, allowNull: true, validate: { isUrl: { msg: 'Website must be valid URL' } } },
      rut: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notNull: { msg: 'RUT is required' },
          notEmpty: { msg: 'RUT cannot be empty' },
          is: { args: /^(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]|\d{7,8}-[\dkK])$/, msg: 'Invalid RUT format' }
        }
      },
      paymentTerms: { type: DataTypes.STRING, allowNull: true },
      status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active', allowNull: false },
      notes: { type: DataTypes.STRING, allowNull: true }
    }, {
      sequelize,
      modelName: 'Supplier',
      tableName: 'suppliers',
      timestamps: true,
      paranoid: true,
      deletedAt: 'deleted_at'
    })
  }

  static associate (models) {
    // Muchos a muchos con Category
    Supplier.belongsToMany(models.Category, { through: 'SupplierCategories', as: 'categories', foreignKey: 'supplierId' })
    // Uno a muchos con Product
    Supplier.hasMany(models.Product, { foreignKey: 'supplierId', as: 'products' })
  }
}

export default Supplier
