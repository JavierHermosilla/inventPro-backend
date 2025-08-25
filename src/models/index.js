import sequelize from '../config/db.js'
import User from './user.model.js'
import Product from './product.model.js'
import Category from './category.model.js'
import Order from './order.model.js'
import ManualInventory from './manualInventory.model.js'
import Supplier from './supplier.model.js'

export const initializeModels = () => {
  // Inicializar modelos
  User.initialize(sequelize)
  Product.initialize(sequelize)
  Category.initialize(sequelize)
  Order.initialize(sequelize)
  ManualInventory.initialize(sequelize)
  Supplier.initialize?.(sequelize) // Si Supplier usa define(), no necesita init

  // Relaciones
  Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' })
  Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' })

  Product.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' })
  Supplier.hasMany(Product, { foreignKey: 'supplierId', as: 'products' })

  Order.belongsTo(User, { foreignKey: 'customerId', as: 'customer' })
  User.hasMany(Order, { foreignKey: 'customerId', as: 'orders' })

  ManualInventory.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
  Product.hasMany(ManualInventory, { foreignKey: 'productId', as: 'manualAdjustments' })

  ManualInventory.belongsTo(User, { foreignKey: 'userId', as: 'user' })
  User.hasMany(ManualInventory, { foreignKey: 'userId', as: 'manualAdjustments' })

  Supplier.belongsToMany(Category, { through: 'SupplierCategories', as: 'categories', foreignKey: 'supplierId' })
  Category.belongsToMany(Supplier, { through: 'SupplierCategories', as: 'suppliers', foreignKey: 'categoryId' })
}

export const models = { User, Product, Category, Order, ManualInventory, Supplier }
export { sequelize }
