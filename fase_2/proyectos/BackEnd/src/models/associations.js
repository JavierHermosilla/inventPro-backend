// src/models/associations.js
// Centraliza y aplica asociaciones de forma explícita para evitar errores
// de "X is not associated to Y" cuando el registro de modelos ocurre en
// distintos tiempos o contextos.

const DEFAULT_SCHEMA =
  process.env.NODE_ENV === 'test'
    ? 'test'
    : (process.env.DB_SCHEMA || 'inventpro_user')

let associationsApplied = false

export function applyAssociations (models, schemaOverride) {
  if (associationsApplied) return models

  const schema = schemaOverride || DEFAULT_SCHEMA
  const {
    Supplier,
    Category,
    Product,
    User,
    Order,
    OrderProduct,
    ManualInventory,
    Client,
    Report
  } = models

  if (!Supplier || !Category || !Product || !User || !Order || !OrderProduct || !ManualInventory || !Client || !Report) {
    throw new Error('Modelos no inicializados antes de aplicar asociaciones')
  }

  // ==========================
  // Supplier ↔ Category (M:N)
  // ==========================
  Supplier.belongsToMany(Category, {
    through: { model: 'SupplierCategories', schema },
    foreignKey: { name: 'supplierId', field: 'supplier_id' },
    otherKey: { name: 'categoryId', field: 'category_id' },
    as: 'categoriesSupplied'
  })

  Category.belongsToMany(Supplier, {
    through: { model: 'SupplierCategories', schema },
    foreignKey: { name: 'categoryId', field: 'category_id' },
    otherKey: { name: 'supplierId', field: 'supplier_id' },
    as: 'suppliedBy'
  })

  // ==========================
  // Product ↔ Category (1:N)
  // ==========================
  Product.belongsTo(Category, {
    as: 'category',
    foreignKey: { name: 'categoryId', field: 'category_id', allowNull: false },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
    schema
  })
  Category.hasMany(Product, {
    as: 'categoryProducts',
    foreignKey: { name: 'categoryId', field: 'category_id' },
    schema
  })

  // ==========================
  // Product ↔ Supplier (1:N)
  // ==========================
  Product.belongsTo(Supplier, {
    as: 'supplier',
    foreignKey: { name: 'supplierId', field: 'supplier_id', allowNull: false },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
    schema
  })
  Supplier.hasMany(Product, {
    as: 'supplierProducts',
    foreignKey: { name: 'supplierId', field: 'supplier_id' },
    schema
  })

  // ==========================
  // Order ↔ Client (1:N)
  // ==========================
  Order.belongsTo(Client, {
    as: 'client',
    foreignKey: { name: 'clientId', field: 'client_id', allowNull: true },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    schema
  })
  Client.hasMany(Order, {
    as: 'orders',
    foreignKey: { name: 'clientId', field: 'client_id' },
    schema
  })

  // ==========================
  // Order ↔ OrderProduct (1:N)
  // ==========================
  Order.hasMany(OrderProduct, {
    as: 'items',
    foreignKey: { name: 'orderId', field: 'order_id', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    schema
  })
  OrderProduct.belongsTo(Order, {
    as: 'order',
    foreignKey: { name: 'orderId', field: 'order_id', allowNull: false },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    schema
  })

  // ==========================
  // Product ↔ OrderProduct (1:N)
  // ==========================
  Product.hasMany(OrderProduct, {
    as: 'orderLines',
    foreignKey: { name: 'productId', field: 'product_id', allowNull: false },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
    schema
  })
  OrderProduct.belongsTo(Product, {
    as: 'product',
    foreignKey: { name: 'productId', field: 'product_id', allowNull: false },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
    schema
  })

  // ==========================
  // ManualInventory ↔ Product (1:N)
  // ==========================
  ManualInventory.belongsTo(Product, {
    as: 'product',
    foreignKey: { name: 'productId', field: 'product_id', allowNull: false },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
    schema
  })
  Product.hasMany(ManualInventory, {
    as: 'inventoryAdjustments',
    foreignKey: { name: 'productId', field: 'product_id' },
    schema
  })

  // ==========================
  // ManualInventory ↔ User (1:N)
  // ==========================
  ManualInventory.belongsTo(User, {
    as: 'performedBy',
    foreignKey: { name: 'userId', field: 'user_id', allowNull: false },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
    schema
  })
  User.hasMany(ManualInventory, {
    as: 'inventoryAdjustments',
    foreignKey: { name: 'userId', field: 'user_id' },
    schema
  })

  // ==========================
  // Report ↔ User (1:N)
  // ==========================
  Report.belongsTo(User, {
    as: 'creator',
    foreignKey: { name: 'createdBy', field: 'created_by', allowNull: false },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
    schema
  })
  User.hasMany(Report, {
    as: 'reports',
    foreignKey: { name: 'createdBy', field: 'created_by' },
    schema
  })

  associationsApplied = true
  return models
}

export default applyAssociations
