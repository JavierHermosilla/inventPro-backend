import { DataTypes, Model } from 'sequelize'
import sequelize from '../config/db.js'
import { ROLES } from '../config/roles.js'
import bcrypt from 'bcryptjs'

class User extends Model {
  async comparePassword (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password)
  }
}

User.init({
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    set (value) {
      this.setDataValue('username', value.trim().toLowerCase()) // Normalize username
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    set (value) {
      this.setDataValue('name', value.trim()) // Normalize name
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^[0-9+()\-\s]+$/i // Validates that phone contains only numbers
    }
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
    set (value) {
      this.setDataValue('address', value ? value.trim() : '') // Normalize address
    }
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  role: {
    type: DataTypes.ENUM(...Object.values(ROLES)),
    defaultValue: ROLES.USER,
    validate: {
      isIn: [Object.values(ROLES)]
    }
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  paranoid: true,
  defaultScope: {
    attributes: { exclude: ['password'] } // Exclude password by default
  },
  hooks: {
    async beforeCreate (user) {
      const salt = await bcrypt.genSalt(10)
      user.password = await bcrypt.hash(user.password, salt)
    },
    async beforeUpdate (user) {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(user.password, salt)
      }
    }
  }
})

export default User
