import { DataTypes, Model } from 'sequelize'
import bcrypt from 'bcryptjs'
import { ROLES } from '../config/roles.js'

class User extends Model {
  // 🔹 Inicialización del modelo
  static initialize (sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        username: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: { name: 'unique_username', msg: 'Username ya registrado' },
          set (value) {
            this.setDataValue('username', value?.trim().toLowerCase())
          }
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          set (value) {
            this.setDataValue('name', value?.trim())
          }
        },
        email: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: { name: 'unique_email', msg: 'Email ya registrado' },
          validate: { isEmail: { msg: 'Email inválido' } },
          set (value) {
            this.setDataValue('email', value?.trim().toLowerCase())
          }
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: { len: { args: [8, 100], msg: 'La contraseña debe tener al menos 8 caracteres' } }
        },
        phone: {
          type: DataTypes.STRING(20),
          allowNull: true,
          validate: { is: /^[0-9+()\-\s]+$/i }
        },
        address: {
          type: DataTypes.STRING,
          allowNull: true,
          set (value) {
            this.setDataValue('address', value?.trim() || '')
          }
        },
        avatar: { type: DataTypes.STRING, defaultValue: '' },
        role: {
          type: DataTypes.ENUM(...Object.values(ROLES)),
          defaultValue: ROLES.USER,
          validate: { isIn: [Object.values(ROLES)] }
        },
        // 🔹 Timestamps personalizados
        createdAt: { type: DataTypes.DATE, field: 'createdat' },
        updatedAt: { type: DataTypes.DATE, field: 'updatedat' },
        deletedAt: { type: DataTypes.DATE, field: 'deletedat' }
      },
      {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
        paranoid: true,
        defaultScope: { attributes: { exclude: ['password'] } },
        scopes: { withPassword: { attributes: { include: ['password'] } } },
        hooks: {
          beforeCreate: async (user) => {
            if (user.password) {
              const salt = await bcrypt.genSalt(10)
              user.password = await bcrypt.hash(user.password, salt)
            }
          },
          beforeUpdate: async (user) => {
            if (user.changed('password') && user.password) {
              const salt = await bcrypt.genSalt(10)
              user.password = await bcrypt.hash(user.password, salt)
            }
          }
        }
      }
    )
  }

  // 🔹 Relaciones
  // static associate (models, schema) {
  //   this.hasMany(models.Order, { foreignKey: 'customerId', as: 'customerOrders', schema })
  //   this.hasMany(models.ManualInventory, { foreignKey: 'userId', as: 'userInventoryAdjustments', schema })
  //   this.hasMany(models.Report, { foreignKey: 'createdBy', as: 'createdReports', schema })
  // }

  // // 🔹 Método para comparar contraseñas
  // async comparePassword (candidatePassword) {
  //   return bcrypt.compare(candidatePassword, this.password)
  // }
}

export default User
