import { DataTypes, Model } from 'sequelize'

class Client extends Model {
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
          validate: {
            notNull: { msg: 'El nombre del cliente es obligatorio' },
            notEmpty: { msg: 'El nombre del cliente no puede estar vacío' }
          },
          set (value) {
            this.setDataValue('name', value?.trim() || '')
          }
        },
        rut: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            is: {
              args: /^\d{1,2}\.?\d{3}\.?\d{3}-[0-9Kk]$/,
              msg: 'RUT inválido'
            }
          },
          set (value) {
            this.setDataValue('rut', value?.trim().toUpperCase())
          }
        },
        address: {
          type: DataTypes.STRING,
          allowNull: false,
          set (value) {
            this.setDataValue('address', value?.trim() || '')
          }
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: false,
          set (value) {
            this.setDataValue('phone', value?.trim() || '')
          }
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: { isEmail: { msg: 'Email inválido' } },
          set (value) {
            this.setDataValue('email', value?.trim().toLowerCase() || '')
          }
        },
        avatar: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: null,
          set (value) {
            this.setDataValue('avatar', value?.trim() || null)
          }
        }
      },
      {
        sequelize,
        modelName: 'Client',
        tableName: 'clients',
        timestamps: true,
        paranoid: true,
        hooks: {
          beforeCreate: (client) => {
            client.name = client.name.trim()
            client.rut = client.rut.trim().toUpperCase()
          },
          beforeUpdate: (client) => {
            client.name = client.name.trim()
            client.rut = client.rut.trim().toUpperCase()
          }
        }
      }
    )
  }

  // 🔹 Definición de relaciones
  // static associate (models, schema) {
  //   // Uno a muchos: Client -> Order
  //   this.hasMany(models.Order, { foreignKey: 'clientId', as: 'clientOrders', schema })
  // }
}

export default Client
