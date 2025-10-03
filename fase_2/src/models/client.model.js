import { DataTypes, Model } from 'sequelize'

class Client extends Model {
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
          validate: {
            notNull: { msg: 'El nombre del cliente es obligatorio' },
            notEmpty: { msg: 'El nombre del cliente no puede estar vacío' }
          },
          set (value) {
            this.setDataValue('name', String(value ?? '').trim())
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
              msg: 'RUT inválido (formato normalizado: 12345678-9)'
            }
          },
          set (value) {
            const v = String(value ?? '').toUpperCase().trim().replace(/\./g, '')
            this.setDataValue('rut', v)
          }
        },

        address: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: { notEmpty: { msg: 'La dirección es obligatoria' } },
          set (value) {
            this.setDataValue('address', String(value ?? '').trim())
          }
        },

        phone: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: { msg: 'El teléfono es obligatorio' },
            is: {
              args: /^\+?[0-9()\-\s]{7,20}$/,
              msg: 'Teléfono inválido'
            }
          },
          set (value) {
            this.setDataValue('phone', String(value ?? '').trim())
          }
        },

        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            notEmpty: { msg: 'El email es obligatorio' },
            isEmail: { msg: 'Email inválido' }
          },
          set (value) {
            this.setDataValue('email', String(value ?? '').trim().toLowerCase())
          }
        },

        avatar: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: null,
          set (value) {
            const v = value == null ? null : String(value).trim()
            this.setDataValue('avatar', v || null)
          }
        }
      },
      {
        sequelize,
        modelName: 'Client',
        tableName: 'clients',

        timestamps: true,
        paranoid: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',

        indexes: [
          { unique: true, fields: ['rut'] },
          { unique: true, fields: ['email'] },
          { fields: ['name'] },
          { fields: ['created_at'] }
        ],

        hooks: {
          beforeCreate: (client) => {
            if (client.name) client.name = String(client.name).trim()
            if (client.rut) client.rut = String(client.rut).toUpperCase().trim().replace(/\./g, '')
          },
          beforeUpdate: (client) => {
            if (client.name) client.name = String(client.name).trim()
            if (client.rut) client.rut = String(client.rut).toUpperCase().trim().replace(/\./g, '')
          }
        }
      }
    )
  }
}

export default Client
