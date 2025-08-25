import { DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

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
    allowNull: true,
    set (value) {
      this.setDataValue('description', value?.trim() || '')
    }
  }
}, {
  timestamps: true,
  paranoid: true,
  tableName: 'categories',
  hooks: {
    beforeCreate: (category) => {
      category.name = category.name.trim()
    },
    beforeUpdate: (category) => {
      category.name = category.name.trim()
    }
  }
})

export default Category
