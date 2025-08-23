import {
  Supplier,
  Category,
  Product,
  User,
  Order,
  ManualInventory
} from './.model'

// ====== Muchos a muchos ======
Supplier.belongsToMany(Category, {
  through: 'SupplierCategories',
  foreignKey: 'supplierId'
})

Category.belongsToMany(Supplier, {
  through: 'SupplierCategories',
  foreignKey: 'categoryId'
})

// ====== Uno a muchos: Product ↔ Category ======
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' })
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' })

// ====== Uno a muchos: Product ↔ Supplier ======
Product.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' })
Supplier.hasMany(Product, { foreignKey: 'supplierId', as: 'products' })

// ====== Uno a muchos: Order ↔ User (cliente) ======
Order.belongsTo(User, { foreignKey: 'customerId', as: 'customer' })
User.hasMany(Order, { foreignKey: 'customerId', as: 'orders' })

// ====== Uno a muchos: ManualInventory ↔ Product ======
ManualInventory.belongsTo(Product, { foreignKey: 'productId', as: 'product' })
Product.hasMany(ManualInventory, { foreignKey: 'productId', as: 'manualAdjustments' })

// ====== Uno a muchos: ManualInventory ↔ User ======
ManualInventory.belongsTo(User, { foreignKey: 'userId', as: 'user' })
User.hasMany(ManualInventory, { foreignKey: 'userId', as: 'manualAdjustments' })

export { Supplier, Category, Product, User, Order, ManualInventory }
