import mongoose from 'mongoose'
import Product from '../models/product.model.js'
import pick from 'lodash/pick.js'
import Supplier from '../models/supplier.model.js'
import logger from '../utils/logger.js'

// creacion de productos
export const createProduct = async (req, res) => {
  try {
    const allowedFields = ['name', 'description', 'price', 'stock', 'category', 'supplier']
    const productData = pick(req.body, allowedFields)
    if (productData.supplier) {
      const supplierExists = await Supplier.findById(productData.supplier)
      if (!supplierExists) {
        return res.status(400).json({ message: 'Supplier not found.' })
      }
    }

    const existingProduct = await Product.findOne({ name: productData.name })
    if (existingProduct) {
      return res.status(400).json({
        message: 'A product with this name already exists.',
        field: 'name'
      })
    }

    const newProduct = new Product(productData)
    await newProduct.save()

    // auditoria desarrollo
    logger.info(`[AUDIT] user ${req.user.id} created product ${newProduct._id} (${newProduct.name})`)

    res.status(201).json({
      message: 'Product created successfully.',
      productId: newProduct._id
    })
  } catch (err) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.name) {
      return res.status(400).json({
        message: 'A product with this name already exists.',
        field: 'name'
      })
    }
    logger.error('Error creating product', { message: err.message, stack: err.stack })
    res.status(500).json({
      message: 'An error occurred while creating the product.',
      error: err.message
    })
  }
}
// obtencion de todos los productos
export const products = async (req, res) => {
  try {
    // obtiene page y el limit de la query params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10

    // calcula cuantos doc saltar
    const skip = (page - 1) * limit

    const total = await Product.countDocuments()
    const products = await Product.find().sort({ createdAt: -1 }).skip(skip).limit(limit)

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      products
    })
  } catch (err) {
    logger.error('Error fetching products', { message: err.message, stack: err.stack })
    res.status(500).json({ message: 'An error occurred while fetching the products.' })
  }
}
// obtencion de productos por id
export const productById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid product ID.' })
  }
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found.' })

    res.json(product)
  } catch (err) {
    logger.error('Error searching product by ID', { message: err.message, stack: err.stack })
    res.status(500).json({
      message: 'An error occurred while searching for the product.',
      error: err.message
    })
  }
}
// actualizacion de productos (solo admin)
export const updateProduct = async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid product ID.' })
  }
  try {
    const allowedFields = ['name', 'description', 'price', 'stock', 'category']
    const updateData = pick(req.body, allowedFields)

    if (updateData.name) {
      const existingProduct = await Product.findOne({ name: updateData.name })
      if (existingProduct && existingProduct._id.toString() !== id) {
        return res.status(400).json({
          message: 'Another product with this name already exists.',
          field: 'name'
        })
      }
    }

    const replaceStock = Object.prototype.hasOwnProperty.call(req.body, 'replaceStock')
      ? ['true', true, '1', 1].includes(req.body.replaceStock)
      : false

    const product = await Product.findById(id).lean()
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    if (updateData.stock !== undefined) {
      if (!Number.isInteger(updateData.stock) || updateData.stock < 0) {
        return res.status(400).json({ message: 'Stock must be a non-negative integer.' })
      }
      if (replaceStock) {
        // aquí el stock es reemplazado tal cual viene
        logger.info(`[AUDIT] user ${req.user.id} replaced the stock of ${product.name} with ${updateData.stock}`)
      } else {
        // aquí se suma el stock existente con el nuevo
        updateData.stock = product.stock + updateData.stock
        logger.info(`[AUDIT] user ${req.user.id} added ${req.body.stock} units to ${product.name}, total stock now: ${updateData.stock}`)
      }
    }

    const updateProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    )
    if (!updateProduct) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    res.json({
      message: 'Product updated successfully.',
      product: updateProduct
    })
  } catch (err) {
    logger.error('Error updating product', { message: err.message, stack: err.stack })
    res.status(500).json({
      message: 'An error occurred while updating the product.',
      error: err.message
    })
  }
}
// eliminacion de prodcto (solo admin)
export const deleteProduct = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid product ID.' })
  }
  try {
    const deleteProduct = await Product.findByIdAndDelete(req.params.id)
    if (!deleteProduct) return res.status(404).json({ message: 'Product not found.' })

    // auditoria simple de desarrollo
    logger.info(`[AUDIT] user ${req.user.id} deleted product ${deleteProduct._id} (${deleteProduct.name})`)

    res.json({ message: 'Product deleted successfully.', product: deleteProduct })
  } catch (err) {
    logger.error('Error deleting product', { message: err.message, stack: err.stack })
    res.status(500).json({
      message: 'Error deleting product.',
      error: err.message
    })
  }
}
