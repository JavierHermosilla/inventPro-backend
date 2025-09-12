import { DataTypes, Model } from 'sequelize'

class Supplier extends Model {
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
          unique: true,
          set (value) {
            this.setDataValue('name', value?.trim() || '')
          }
        },
        contactName: {
          type: DataTypes.STRING,
          allowNull: true,
          set (value) {
            this.setDataValue('contactName', value?.trim() || '')
          }
        },
        email: {
          type: DataTypes.STRING,
          allowNull: true,
          validate: { isEmail: { msg: 'Invalid email' } },
          set (value) {
            this.setDataValue('email', value?.trim().toLowerCase() || null)
          }
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: true,
          validate: {
            is: {
              args: /^\+?[0-9()\-\s]{7,20}$/,
              msg: 'Phone must be valid'
            }
          },
          set (value) {
            this.setDataValue('phone', value?.trim() || null)
          }
        },
        address: {
          type: DataTypes.STRING,
          allowNull: true,
          set (value) {
            this.setDataValue('address', value?.trim() || null)
          }
        },
        website: {
          type: DataTypes.STRING,
          allowNull: true,
          validate: {
            isUrl: { msg: 'Website must be valid URL' }
          },
          set (value) {
            this.setDataValue('website', value?.trim().toLowerCase() || null)
          }
        },
        rut: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            notNull: { msg: 'RUT is required' },
            notEmpty: { msg: 'RUT cannot be empty' },
            is: {
              args: /^(\d{7,8}-[\dkK])$/,
              msg: 'Invalid RUT format (normalized)'
            }
          },
          set (value) {
            if (!value) return this.setDataValue('rut', '')
            const upper = String(value).toUpperCase().trim()
            const noDots = upper.replace(/\./g, '')
            this.setDataValue('rut', noDots)
          }
        },
        paymentTerms: {
          type: DataTypes.STRING,
          allowNull: true,
          set (value) {
            this.setDataValue('paymentTerms', value?.trim() || null)
          }
        },
        status: {
          type: DataTypes.ENUM('active', 'inactive'),
          defaultValue: 'active',
          allowNull: false
        },
        notes: {
          type: DataTypes.STRING,
          allowNull: true,
          set (value) {
            this.setDataValue('notes', value?.trim() || null)
          }
        }
      },
      {
        sequelize,
        modelName: 'Supplier',
        tableName: 'suppliers',
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        indexes: [
          { unique: true, fields: ['name'] },
          { unique: true, fields: ['rut'] }
        ],
        hooks: {
          beforeCreate: (supplier) => {
            supplier.name = supplier.name.trim()
            supplier.rut = supplier.rut.trim()
          },
          beforeUpdate: (supplier) => {
            if (supplier.name) supplier.name = supplier.name.trim()
            if (supplier.rut) supplier.rut = supplier.rut.trim()
          }
        }
      }
    )
  }

  // 🔹 Relaciones
  // static associate (models, schema) {
  //   // Muchos a muchos: Supplier <-> Category
  //   this.belongsToMany(models.Category, {
  //     through: 'SupplierCategories',
  //     as: 'suppliedBy',
  //     foreignKey: 'supplierId',
  //     schema
  //   })

  //   // Uno a muchos: Supplier -> Product
  //   this.hasMany(models.Product, { foreignKey: 'supplierId', as: 'supplierProducts', schema })
  // }
}

export default Supplier
