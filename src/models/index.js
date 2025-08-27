// src/models/index.js
import sequelize from '../db/db.js'

import User from './user.model.js'
import Product from './product.model.js'
import Category from './category.model.js'
import Order from './order.model.js'
import OrderProduct from './orderProduct.model.js'
import ManualInventory from './manualInventory.model.js'
import Supplier from './supplier.model.js'
import Client from './client.model.js'
import Report from './reports.model.js'

export const models = {
  User,
  Product,
  Category,
  Order,
  OrderProduct,
  ManualInventory,
  Supplier,
  Client,
  Report
}

// Exportar modelos individualmente
export {
  sequelize,
  User,
  Product,
  Category,
  Order,
  OrderProduct,
  ManualInventory,
  Supplier,
  Client,
  Report
}

export const initializeModels = () => {
  const schema = process.env.NODE_ENV === 'test' ? 'test' : undefined

  Object.values(models).forEach(model => model.initialize(sequelize))
  Object.values(models).forEach(model => {
    if (typeof model.associate === 'function') {
      model.associate(models, schema)
    }
  })
}
