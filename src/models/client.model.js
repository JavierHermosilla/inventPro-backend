import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Client = sequelize.define('clients', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: 'client name is required' },
      notEmpty: { msg: 'client name should not be empty' }
    }
  },
  rut: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notNull: { msg: 'client rut is required' },
      notEmpty: { msg: 'client rut should not be empty' },
      is: {
        args: /^[0-9]+-[0-9kK]{1}$/,
        msg: 'rut format is invalid'
      }
    }
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: 'client address is required' },
      notEmpty: { msg: 'client address should not be empty' }
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: 'client phone is required' },
      notEmpty: { msg: 'client phone should not be empty' },
      isNumeric: { msg: 'client phone should contain only numbers' },
      len: {
        args: [8, 15],
        msg: 'client phone should be between 8 and 15 digits'
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notNull: { msg: 'client email is required' },
      notEmpty: { msg: 'client email should not be empty' },
      isEmail: { msg: 'client email format is invalid' }
    }
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  }
}, {
  tableName: 'clients',
  timestamps: true,
  paranoid: true
})

export default Client
