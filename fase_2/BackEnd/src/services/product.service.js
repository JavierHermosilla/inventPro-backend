// src/services/product.service.js
import { Op } from 'sequelize'
import Product from '../models/product.model.js'
import Category from '../models/category.model.js'
import Supplier from '../models/supplier.model.js'

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
  return newProduct
}

export async function listProductsService ({ page = 1, limit = 10 }) {
  const pageInt = Math.max(parseInt(page, 10) || 1, 1)
  const limitInt = Math.max(parseInt(limit, 10) || 10, 1)
  const offset = (pageInt - 1) * limitInt

  const { count: total, rows } = await Product.findAndCountAll({
    include: [
      { model: Category, as: 'category' },
      { model: Supplier, as: 'supplier' }
    ],
    order: [['created_at', 'DESC']],
    limit: limitInt,
    offset
  })

  return {
    page: pageInt,
    limit: limitInt,
    total,
    totalPages: Math.ceil(total / limitInt),
    products: rows
  }
}

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
  return product
}

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
  return product
}

export async function deleteProductService (id) {
  const product = await Product.findByPk(id)
  if (!product) {
    const err = new Error('Product not found.')
    err.status = 404
    throw err
  }
  await product.destroy()
  return { message: 'Product deleted successfully.', product }
}
