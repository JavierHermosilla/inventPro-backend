import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Category = sequelize.define('Category', {
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
      notNull: { msg: 'Category name is required' },
      notEmpty: { msg: 'Category name should not be empty' }
    }
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  paranoid: true,
  tableName: 'categories'
})

export default Category
