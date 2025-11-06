// src/services/product.service.js
import { Op, fn, col, where as sqWhere } from 'sequelize'
import { models } from '../models/index.js'

const { Product, Category, Supplier } = models

// Activa modo acentos-insensible si en .env: SEARCH_ACCENT_INSENSITIVE=true
// En Postgres: CREATE EXTENSION IF NOT EXISTS unaccent;
const ACCENT_INSENSITIVE = String(process.env.SEARCH_ACCENT_INSENSITIVE || 'false').toLowerCase() === 'true'

/** Quita tildes a nivel JS (fallback para construir patrón) */
const deaccent = (s = '') => s.normalize('NFD').replace(/\p{Diacritic}/gu, '')

// ---------- mapper de salida pública ----------
function sanitizeProduct (p) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    stock: p.stock,
    category: p.category ? { id: p.category.id, name: p.category.name } : null,
    supplier: p.supplier ? { id: p.supplier.id, name: p.supplier.name } : null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  }
}

// =======================
// Create
// =======================
export async function createProductService (payload) {
  const { name, description, price, stock, categoryId, supplierId, supplierRut } = payload

  if (!categoryId) {
    const err = new Error('Category ID is required.')
    err.status = 400
    throw err
  }
  if (!supplierId && !supplierRut) {
    const err = new Error('Provide supplierId or supplierRut.')
    err.status = 400
    throw err
  }

  const category = await Category.findByPk(categoryId)
  if (!category) {
    const err = new Error('Category not found.')
    err.status = 404
    throw err
  }

  let resolvedSupplierId = supplierId
  if (!resolvedSupplierId && supplierRut) {
    const sup = await Supplier.findOne({ where: { rut: supplierRut } })
    if (!sup) {
      const err = new Error('Supplier not found by RUT.')
      err.status = 404
      throw err
    }
    resolvedSupplierId = sup.id
  }

  if (supplierId && supplierRut) {
    const sup = await Supplier.findOne({ where: { rut: supplierRut } })
    if (!sup || sup.id !== supplierId) {
      const err = new Error('supplierId and supplierRut refer to different suppliers.')
      err.status = 400
      throw err
    }
  }

  const exists = await Product.findOne({ where: { name } })
  if (exists) {
    const err = new Error('A product with this name already exists.')
    err.status = 400
    err.field = 'name'
    throw err
  }

  const priceNum = Number(price)
  const stockNum = Number(stock)
  if (!Number.isFinite(priceNum) || priceNum < 0) {
    const err = new Error('Price must be a non-negative number.')
    err.status = 400
    throw err
  }
  if (!Number.isInteger(stockNum) || stockNum < 0) {
    const err = new Error('Stock must be a non-negative integer.')
    err.status = 400
    throw err
  }

  const newProduct = await Product.create({
    name,
    description,
    price: priceNum,
    stock: stockNum,
    categoryId,
    supplierId: resolvedSupplierId
  })
  return sanitizeProduct(newProduct)
}

// =======================
// List (con búsqueda y orden seguro)
// =======================
export async function listProductsService (params = {}) {
  const {
    page = 1,
    limit = 10,
    search = '',
    categoryId,
    supplierId,
    minStock,
    maxStock,
    orderBy = 'created_at', // name|price|stock|created_at|updated_at
    sort = 'DESC' // ASC|DESC
  } = params

  const pageInt = Math.max(parseInt(page, 10) || 1, 1)
  const limitInt = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100)
  const offset = (pageInt - 1) * limitInt

  const where = {}
  const and = []

  // Filtros directos
  if (categoryId) where.categoryId = categoryId
  if (supplierId) where.supplierId = supplierId

  const toFinite = (v) => { const n = Number(v); return Number.isFinite(n) ? n : undefined }
  const gte = toFinite(minStock)
  const lte = toFinite(maxStock)
  if (gte !== undefined || lte !== undefined) {
    where.stock = {}
    if (gte !== undefined) where.stock[Op.gte] = gte
    if (lte !== undefined) where.stock[Op.lte] = lte
  }

  // Búsqueda por nombre de producto/categoría/proveedor
  const s = String(search).trim()
  if (s) {
    if (ACCENT_INSENSITIVE) {
      const pattern = `%${deaccent(s)}%`
      and.push({
        [Op.or]: [
          // Todas las columnas calificadas para evitar ambigüedad:
          sqWhere(fn('unaccent', col('Product.name')), { [Op.iLike]: pattern }),
          sqWhere(fn('unaccent', col('category.name')), { [Op.iLike]: pattern }),
          sqWhere(fn('unaccent', col('supplier.name')), { [Op.iLike]: pattern })
        ]
      })
    } else {
      and.push({
        [Op.or]: [
          { [col('Product.name')]: { [Op.iLike]: `%${s}%` } },
          { '$category.name$': { [Op.iLike]: `%${s}%` } },
          { '$supplier.name$': { [Op.iLike]: `%${s}%` } }
        ]
      })
    }
  }
  if (and.length) where[Op.and] = and

  // Orden seguro, calificado
  const allowed = ['name', 'price', 'stock', 'created_at', 'updated_at']
  const field = allowed.includes(String(orderBy)) ? String(orderBy) : 'created_at'
  const dir = String(sort).toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
  const orderMap = {
    name: col('Product.name'),
    price: col('Product.price'),
    stock: col('Product.stock'),
    created_at: col('Product.created_at'),
    updated_at: col('Product.updated_at')
  }

  const { count: total, rows } = await Product.findAndCountAll({
    where,
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name'], required: false },
      { model: Supplier, as: 'supplier', attributes: ['id', 'name'], required: false }
    ],
    order: [[orderMap[field], dir]],
    limit: limitInt,
    offset,
    distinct: true, // evita sobreconteo por los JOINs
    subQuery: false // genera SQL más limpio con include + order calificado
  })

  return {
    page: pageInt,
    limit: limitInt,
    total,
    totalPages: Math.ceil(total / limitInt) || 1,
    products: rows.map(sanitizeProduct)
  }
}

// =======================
// Get by ID
// =======================
export async function getProductByIdService (id) {
  const product = await Product.findByPk(id, {
    include: [
      { model: Category, as: 'category' },
      { model: Supplier, as: 'supplier' }
    ]
  })
  if (!product) {
    const err = new Error('Product not found.')
    err.status = 404
    throw err
  }
  return sanitizeProduct(product)
}

// =======================
// Update
// =======================
export async function updateProductService (id, payload, options = {}) {
  const product = await Product.findByPk(id)
  if (!product) {
    const err = new Error('Product not found.')
    err.status = 404
    throw err
  }

  const data = { ...payload }

  if (data.name) {
    const exists = await Product.findOne({
      where: { name: data.name, id: { [Op.ne]: id } }
    })
    if (exists) {
      const err = new Error('Another product with this name already exists.')
      err.status = 400
      err.field = 'name'
      throw err
    }
  }

  if (data.categoryId) {
    const cat = await Category.findByPk(data.categoryId)
    if (!cat) {
      const err = new Error('Category not found.')
      err.status = 404
      throw err
    }
  }

  // Resolver supplier por RUT opcionalmente
  if (data.supplierRut && !data.supplierId) {
    const sup = await Supplier.findOne({ where: { rut: data.supplierRut } })
    if (!sup) {
      const err = new Error('Supplier not found by RUT.')
      err.status = 404
      throw err
    }
    data.supplierId = sup.id
  } else if (data.supplierRut && data.supplierId) {
    const sup = await Supplier.findOne({ where: { rut: data.supplierRut } })
    if (!sup || sup.id !== data.supplierId) {
      const err = new Error('supplierId and supplierRut refer to different suppliers.')
      err.status = 400
      throw err
    }
  }
  delete data.supplierRut

  if (data.price !== undefined) {
    const priceNum = Number(data.price)
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      const err = new Error('Price must be a non-negative number.')
      err.status = 400
      throw err
    }
    data.price = priceNum
  }

  const replaceStock = options.replaceStock ?? ['true', true, '1', 1].includes(payload.replaceStock)
  if (data.stock !== undefined) {
    const inc = Number(data.stock)
    if (!Number.isInteger(inc) || inc < 0) {
      const err = new Error('Stock must be a non-negative integer.')
      err.status = 400
      throw err
    }
    data.stock = replaceStock ? inc : product.stock + inc
  }

  await product.update(data)

  const refreshed = await Product.findByPk(id, {
    include: [
      { model: Category, as: 'category' },
      { model: Supplier, as: 'supplier' }
    ]
  })
  return sanitizeProduct(refreshed)
}

// =======================
// Delete
// =======================
export async function deleteProductService (id) {
  const product = await Product.findByPk(id, {
    include: [
      { model: Category, as: 'category' },
      { model: Supplier, as: 'supplier' }
    ]
  })
  if (!product) {
    const err = new Error('Product not found.')
    err.status = 404
    throw err
  }
  await product.destroy()
  return { message: 'Product deleted successfully.', product: sanitizeProduct(product) }
}
