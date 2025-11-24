// src/models/user.model.js
import { DataTypes, Model } from 'sequelize'
import bcrypt from 'bcryptjs'
import { ROLES } from '../config/roles.js'

const isBcryptHash = (val) =>
  typeof val === 'string' && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(val)

class User extends Model {
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
          validate: {
            notEmpty: { msg: 'El username no puede estar vacío' },
            len: { args: [3, 50], msg: 'El username debe tener entre 3 y 50 caracteres' }
          },
          set (value) {
            this.setDataValue('username', String(value ?? '').trim().toLowerCase())
          }
        },

        name: {
          type: DataTypes.STRING(120),
          allowNull: false,
          validate: { notEmpty: { msg: 'El nombre es obligatorio' } },
          set (value) {
            this.setDataValue('name', String(value ?? '').trim())
          }
        },

        email: {
          type: DataTypes.STRING(150),
          allowNull: false,
          unique: { name: 'unique_email', msg: 'Email ya registrado' },
          validate: {
            notEmpty: { msg: 'El email es obligatorio' },
            isEmail: { msg: 'Email inválido' }
          },
          set (value) {
            this.setDataValue('email', String(value ?? '').trim().toLowerCase())
          }
        },

        password: {
          type: DataTypes.STRING, // hash bcrypt
          allowNull: false,
          validate: {
            notEmpty: { msg: 'La contraseña es obligatoria' },
            len: { args: [8, 100], msg: 'La contraseña debe tener al menos 8 caracteres' }
          }
        },

        phone: {
          type: DataTypes.STRING(20),
          allowNull: true,
          validate: { is: /^[0-9+()\-\s]+$/i }
        },

        address: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: null,
          set (value) {
            const v = value == null ? null : String(value).trim()
            this.setDataValue('address', v || null)
          }
        },

        avatar: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: null
        },

        role: {
          type: DataTypes.ENUM(...Object.values(ROLES)),
          allowNull: false,
          defaultValue: ROLES.USER,
          validate: { isIn: [Object.values(ROLES)] }
        }
      },
      {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        schema: 'inventpro_user',

        timestamps: true,
        paranoid: true,
        underscored: true, // created_at / updated_at / deleted_at
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',

        defaultScope: {
          attributes: { exclude: ['password'] }
        },
        scopes: {
          // forzar que realmente se incluya el password aunque defaultScope lo excluya
          withPassword: { attributes: { include: ['password'], exclude: [] } }
        },

        indexes: [
          { unique: true, fields: ['username'] },
          { unique: true, fields: ['email'] },
          { fields: ['role'] }
        ],

        hooks: {
          beforeCreate: async (user) => {
            if (!user.password || isBcryptHash(user.password)) return
            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(user.password, salt)
          },
          beforeUpdate: async (user) => {
            if (!user.changed('password') || !user.password || isBcryptHash(user.password)) return
            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(user.password, salt)
          }
        }
      }
    )
  }

  async comparePassword (candidatePassword) {
    if (!this.password) return false
    return bcrypt.compare(candidatePassword, this.password)
  }

  toJSON () {
    const values = { ...this.get() }
    delete values.password
    return values
  }
}

export default User
