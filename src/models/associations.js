import {
  Supplier,
  Category,
  Product,
  User,
  Order,
  OrderProduct,
  ManualInventory,
  Client,
  Report
} from './index.js'

const schema = process.env.NODE_ENV === 'test' ? 'test' : undefined

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
Order.belongsTo(User, { foreignKey: 'customerId', as: 'customerDetail', schema })
User.hasMany(Order, { foreignKey: 'customerId', as: 'customerOrders', schema })

// ====== Uno a muchos: Order ↔ Client ======
Order.belongsTo(Client, { foreignKey: 'clientId', as: 'client', schema })
Client.hasMany(Order, { foreignKey: 'clientId', as: 'clientOrders', schema })

// ====== Uno a muchos: Order ↔ OrderProduct ======
Order.hasMany(OrderProduct, { foreignKey: 'orderId', as: 'orderItems', schema })
OrderProduct.belongsTo(Order, { foreignKey: 'orderId', as: 'parentOrder', schema })

// ====== Uno a muchos: Product ↔ OrderProduct ======
Product.hasMany(OrderProduct, { foreignKey: 'productId', as: 'orderProducts', schema })
OrderProduct.belongsTo(Product, { foreignKey: 'productId', as: 'orderedProduct', schema })

// ====== Uno a muchos: ManualInventory ↔ Product ======
ManualInventory.belongsTo(Product, { foreignKey: 'productId', as: 'inventoryProduct', schema })
Product.hasMany(ManualInventory, { foreignKey: 'productId', as: 'inventoryAdjustments', schema })

// ====== Uno a muchos: ManualInventory ↔ User ======
ManualInventory.belongsTo(User, { foreignKey: 'userId', as: 'performedBy', schema })
User.hasMany(ManualInventory, { foreignKey: 'userId', as: 'userInventoryAdjustments', schema })

// ====== Uno a muchos: Report ↔ User (creador) ======
Report.belongsTo(User, { foreignKey: 'createdBy', as: 'creator', schema })
User.hasMany(Report, { foreignKey: 'createdBy', as: 'createdReports', schema })

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
