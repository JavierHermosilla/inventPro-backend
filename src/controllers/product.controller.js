import Product from '../models/product.model.js'
import Category from '../models/category.model.js'
import Supplier from '../models/supplier.model.js'
import { Op } from 'sequelize'
import pick from 'lodash/pick.js'
import logger from '../utils/logger.js'

// --------------------- CREATE PRODUCT ---------------------
export const createProduct = async (req, res) => {
  const userIP = req.clientIP
  try {
    const allowedFields = ['name', 'description', 'price', 'stock', 'categoryId', 'supplierId']
    const productData = pick(req.body, allowedFields)

    // Verificar que el proveedor exista
    if (productData.supplierId) {
      const supplierExists = await Supplier.findByPk(productData.supplierId)
      if (!supplierExists) {
        return res.status(400).json({ message: 'Supplier not found.' })
      }
    }

    // Verificar que la categoría exista
    if (productData.categoryId) {
      const categoryExists = await Category.findByPk(productData.categoryId)
      if (!categoryExists) {
        return res.status(400).json({ message: 'Category not found.' })
      }
    }

    // Verificar que no exista producto con mismo nombre
    const existingProduct = await Product.findOne({ where: { name: productData.name } })
    if (existingProduct) {
      return res.status(400).json({ message: 'A product with this name already exists.', field: 'name' })
    }

    const newProduct = await Product.create(productData)

    logger.info(`[AUDIT] user ${req.user.id} created product ${newProduct.id} (${newProduct.name}), IP: ${userIP}`)

    res.status(201).json({
      message: 'Product created successfully.',
      productId: newProduct.id
    })
  } catch (err) {
    logger.error('Error creating product', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: 'An error occurred while creating the product.', error: err.message })
  }
}

// --------------------- LIST PRODUCTS ---------------------
export const products = async (req, res) => {
  const userIP = req.clientIP
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit

    const { count: total, rows } = await Product.findAndCountAll({
      include: [
        { model: Category, as: 'category' },
        { model: Supplier, as: 'supplier' }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    })

    logger.info(`Products listed, page ${page}, limit ${limit}, IP: ${userIP}`)

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      products: rows
    })
  } catch (err) {
    logger.error('Error fetching products', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: 'An error occurred while fetching the products.' })
  }
}

// --------------------- GET PRODUCT BY ID ---------------------
export const productById = async (req, res) => {
  const userIP = req.clientIP
  const { id } = req.params

  try {
    const product = await Product.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: Supplier, as: 'supplier' }
      ]
    })

    if (!product) {
      logger.warn(`Product not found by ID: ${id}, IP: ${userIP}`)
      return res.status(404).json({ message: 'Product not found.' })
    }

    logger.info(`Product retrieved by ID: ${id}, IP: ${userIP}`)
    res.json(product)
  } catch (err) {
    logger.error('Error searching product by ID', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: 'An error occurred while searching for the product.', error: err.message })
  }
}

// --------------------- UPDATE PRODUCT ---------------------
export const updateProduct = async (req, res) => {
  const userIP = req.clientIP
  const { id } = req.params

  try {
    const allowedFields = ['name', 'description', 'price', 'stock', 'categoryId', 'supplierId']
    const updateData = pick(req.body, allowedFields)

    const product = await Product.findByPk(id)
    if (!product) {
      logger.warn(`Product not found in updateProduct: ${id}, IP: ${userIP}`)
      return res.status(404).json({ message: 'Product not found.' })
    }

    // Validación de nombre único
    if (updateData.name) {
      const existingProduct = await Product.findOne({ where: { name: updateData.name, id: { [Op.ne]: id } } })
      if (existingProduct) {
        return res.status(400).json({ message: 'Another product with this name already exists.', field: 'name' })
      }
    }

    // Validar stock
    const replaceStock = ['true', true, '1', 1].includes(req.body.replaceStock)
    if (updateData.stock !== undefined) {
      if (!Number.isInteger(updateData.stock) || updateData.stock < 0) {
        return res.status(400).json({ message: 'Stock must be a non-negative integer.' })
      }

      if (!replaceStock) {
        updateData.stock = product.stock + updateData.stock
      }
    }

    await product.update(updateData)

    logger.info(`[AUDIT] user ${req.user.id} updated product ${product.id} (${product.name}), IP: ${userIP}`)

    res.json({ message: 'Product updated successfully.', product })
  } catch (err) {
    logger.error('Error updating product', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: 'An error occurred while updating the product.', error: err.message })
  }
}

// --------------------- DELETE PRODUCT ---------------------
export const deleteProduct = async (req, res) => {
  const userIP = req.clientIP
  const { id } = req.params

  try {
    const product = await Product.findByPk(id)
    if (!product) {
      logger.warn(`Product not found in deleteProduct: ${id}, IP: ${userIP}`)
      return res.status(404).json({ message: 'Product not found.' })
    }

    await product.destroy()
    logger.info(`[AUDIT] user ${req.user.id} deleted product ${product.id} (${product.name}), IP: ${userIP}`)

    res.json({ message: 'Product deleted successfully.', product })
  } catch (err) {
    logger.error('Error deleting product', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: 'Error deleting product.', error: err.message })
  }
}
