// src/models/associations.js
import Supplier from './supplier.model.js'
import Category from './category.model.js'
import Product from './product.model.js'
import User from './user.model.js'
import Order from './order.model.js'
import OrderProduct from './orderProduct.model.js'
import ManualInventory from './manualInventory.model.js'
import Client from './client.model.js'
import Report from './reports.model.js'

// Schema dinámico (test vs prod)
const schema =
  process.env.NODE_ENV === 'test'
    ? 'test'
    : process.env.DB_SCHEMA || undefined

// ====== Muchos a muchos: Supplier ↔ Category ======
Supplier.belongsToMany(Category, {
  through: { model: 'SupplierCategories', schema },
  foreignKey: 'supplierId',
  as: 'categoriesSupplied'
})

Category.belongsToMany(Supplier, {
  through: { model: 'SupplierCategories', schema },
  foreignKey: 'categoryId',
  as: 'suppliedBy'
})

// ====== Uno a muchos: Product ↔ Category ======
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category', schema })
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'categoryProducts', schema })

// ====== Uno a muchos: Product ↔ Supplier ======
Product.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier', schema })
Supplier.hasMany(Product, { foreignKey: 'supplierId', as: 'supplierProducts', schema })

// ====== Uno a muchos: Order ↔ User ======
Order.belongsTo(User, { foreignKey: 'customerId', as: 'customer', schema })
User.hasMany(Order, { foreignKey: 'customerId', as: 'orders', schema })

// ====== Uno a muchos: Order ↔ Client ======
Order.belongsTo(Client, { foreignKey: 'clientId', as: 'client', schema })
Client.hasMany(Order, { foreignKey: 'clientId', as: 'orders', schema })

// ====== Uno a muchos: Order ↔ OrderProduct ======
Order.hasMany(OrderProduct, { foreignKey: 'orderId', as: 'items', schema })
OrderProduct.belongsTo(Order, { foreignKey: 'orderId', as: 'order', schema })

// ====== Uno a muchos: Product ↔ OrderProduct ======
Product.hasMany(OrderProduct, { foreignKey: 'productId', as: 'orderLines', schema })
OrderProduct.belongsTo(Product, { foreignKey: 'productId', as: 'product', schema })

// ====== Uno a muchos: ManualInventory ↔ Product ======
ManualInventory.belongsTo(Product, { foreignKey: 'productId', as: 'product', schema })
Product.hasMany(ManualInventory, { foreignKey: 'productId', as: 'inventoryAdjustments', schema })

// ====== Uno a muchos: ManualInventory ↔ User ======
ManualInventory.belongsTo(User, { foreignKey: 'userId', as: 'performedBy', schema })
User.hasMany(ManualInventory, { foreignKey: 'userId', as: 'inventoryAdjustments', schema })

// ====== Uno a muchos: Report ↔ User ======
Report.belongsTo(User, { foreignKey: 'createdBy', as: 'creator', schema })
User.hasMany(Report, { foreignKey: 'createdBy', as: 'reports', schema })

export {
  Supplier,
  Category,
  Product,
  User,
  Order,
  OrderProduct,
  ManualInventory,
  Client,
  Report
}
