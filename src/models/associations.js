import {
  Supplier,
  Category,
  Product,
  User,
  Order,
  ManualInventory
} from './.model.js'

const schema = process.env.NODE_ENV === 'test' ? 'test' : undefined

// ====== Muchos a muchos: Supplier ↔ Category ======
Supplier.belongsToMany(Category, {
  through: { model: 'SupplierCategories', schema },
  foreignKey: 'supplierId',
  as: 'categories'
})

Category.belongsToMany(Supplier, {
  through: { model: 'SupplierCategories', schema },
  foreignKey: 'categoryId',
  as: 'suppliers'
})

// ====== Uno a muchos: Product ↔ Category ======
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category', schema })
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products', schema })

// ====== Uno a muchos: Product ↔ Supplier ======
Product.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier', schema })
Supplier.hasMany(Product, { foreignKey: 'supplierId', as: 'products', schema })

// ====== Uno a muchos: Order ↔ User (cliente) ======
Order.belongsTo(User, { foreignKey: 'customerId', as: 'customer', schema })
User.hasMany(Order, { foreignKey: 'customerId', as: 'orders', schema })

// ====== Uno a muchos: ManualInventory ↔ Product ======
ManualInventory.belongsTo(Product, { foreignKey: 'productId', as: 'product', schema })
Product.hasMany(ManualInventory, { foreignKey: 'productId', as: 'manualAdjustments', schema })

// ====== Uno a muchos: ManualInventory ↔ User ======
ManualInventory.belongsTo(User, { foreignKey: 'userId', as: 'user', schema })
User.hasMany(ManualInventory, { foreignKey: 'userId', as: 'manualAdjustments', schema })

export { Supplier, Category, Product, User, Order, ManualInventory }
