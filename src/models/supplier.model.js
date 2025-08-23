import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const supplier = sequelize.define('Supplier', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notNull: { msg: 'Supplier name is required' },
      notEmpty: { msg: 'Supplier name cannot be empty' }
    }
  },
  contactName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: { msg: 'Email must be a valid email address' }
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: {
        args: /^\+?\d{7,15}$/,
        msg: 'Phone must be a valid number (7-15 digits, optional +)'
      }
    }
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: { msg: 'Website must be a valid URL' }
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
        args: /^(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]|\d{7,8}-[\dkK])$/,
        msg: 'RUT is invalid'
      }
    }
  },
  paymentTerms: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    allowNull: false,
    validate: {
      isIn: {
        args: [['active', 'inactive']],
        msg: 'Status must be either active or inactive'
      }
    }
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'suppliers',
  timestamps: true,
  paranoid: true,
  deletedAt: 'deleted_at'
})

export default supplier
