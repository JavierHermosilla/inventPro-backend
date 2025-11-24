import { DataTypes, Model } from 'sequelize'

class Supplier extends Model {
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
            this.setDataValue('name', String(value ?? '').trim())
          },
          validate: {
            notEmpty: { msg: 'El nombre es obligatorio' }
          }
        },
        contactName: {
          type: DataTypes.STRING,
          allowNull: true,
          set (value) {
            const v = value == null ? null : String(value).trim()
            this.setDataValue('contactName', v || null)
          }
        },
        email: {
          type: DataTypes.STRING,
          allowNull: true,
          validate: { isEmail: { msg: 'Email inválido' } },
          set (value) {
            const v = value == null ? null : String(value).trim().toLowerCase()
            this.setDataValue('email', v || null)
          }
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: true,
          validate: {
            is: {
              args: /^\+?[0-9()\-\s]{7,20}$/,
              msg: 'Teléfono inválido'
            }
          },
          set (value) {
            const v = value == null ? null : String(value).trim()
            this.setDataValue('phone', v || null)
          }
        },
        address: {
          type: DataTypes.STRING,
          allowNull: true,
          set (value) {
            const v = value == null ? null : String(value).trim()
            this.setDataValue('address', v || null)
          }
        },
        website: {
          type: DataTypes.STRING,
          allowNull: true,
          validate: { isUrl: { msg: 'URL inválida' } },
          set (value) {
            const v = value == null ? null : String(value).trim().toLowerCase()
            this.setDataValue('website', v || null)
          }
        },
        rut: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            notEmpty: { msg: 'El RUT es obligatorio' },
            is: {
              args: /^(\d{7,8}-[\dkK])$/,
              msg: 'Formato de RUT inválido (normalizado: 12345678-9)'
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
            const v = value == null ? null : String(value).trim()
            this.setDataValue('paymentTerms', v || null)
          }
        },
        status: {
          type: DataTypes.ENUM('active', 'inactive'),
          allowNull: false,
          defaultValue: 'active'
        },
        notes: {
          type: DataTypes.STRING,
          allowNull: true,
          set (value) {
            const v = value == null ? null : String(value).trim()
            this.setDataValue('notes', v || null)
          }
        }
      },
      {
        sequelize,
        modelName: 'Supplier',
        tableName: 'suppliers',

        // ✅ Consistencia global
        timestamps: true,
        paranoid: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',

        defaultScope: {},
        scopes: {
          active: { where: { status: 'active' } }
        },

        indexes: [
          { unique: true, fields: ['name'] },
          { unique: true, fields: ['rut'] },
          { fields: ['status'] }
        ],

        hooks: {
          beforeCreate: (supplier) => {
            if (supplier.name) supplier.name = String(supplier.name).trim()
            if (supplier.rut) supplier.rut = String(supplier.rut).trim()
          },
          beforeUpdate: (supplier) => {
            if (supplier.name) supplier.name = String(supplier.name).trim()
            if (supplier.rut) supplier.rut = String(supplier.rut).trim()
          }
        }
      }
    )
  }
}

export default Supplier
