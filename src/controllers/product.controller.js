import mongoose from 'mongoose'
import Product from '../models/product.model.js'
import pick from 'lodash/pick.js'

// creacion de productos
export const createProduct = async (req, res) => {
  try {
    const allowedFields = ['name', 'description', 'price', 'stock', 'category']
    const newProduct = new Product(pick(req.body, allowedFields))

    await newProduct.save()

    // auditoria desarrollo
    console.log(`[AUDIT] user ${req.user.id} created product ${newProduct._id} (${newProduct.name})`)

    res.status(201).json({
      message: 'Product created successfully.',
      productId: newProduct._id
    })
  } catch (err) {
    console.log(err)
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

    // obtiene el total de productos
    const total = await Product.countDocuments()

    // obtiene los productos con su paginacion
    const products = await Product.find().sort({ createdAt: -1 }).skip(skip).limit(limit)

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      products
    })
  } catch (err) {
    console.error('Error fetching products:', err)
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
    res.status(500).json({
      message: 'An error occurred while searching for the product.',
      error: err.message
    })
  }
}

// actualizacion de productos (solo admin)
export const updateProduct = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid product ID.' })
  }
  try {
    const allowedFields = ['name', 'description', 'price', 'stock', 'category']

    const updateProduct = await Product.findByIdAndUpdate(
      req.params.id,
      pick(req.body, allowedFields),
      {
        new: true,
        runValidators: true
      }
    )
    if (!updateProduct) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    // auditoria simple de desarrollo
    console.log(`[AUDIT] user ${req.user.id} updated product ${updateProduct._id} (${updateProduct.name})`)
    res.json({ message: 'Product updated successfully.', product: updateProduct })
  } catch (err) {
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
    console.log(`[AUDIT] user ${req.user.id} deleted product ${deleteProduct._id} (${deleteProduct.name})`)

    res.json({ message: 'Product deleted successfully.', product: deleteProduct })
  } catch (err) {
    console.error('Error deleting product:', err)
    res.status(500).json({
      message: 'Error deleting product.',
      error: err.message
    })
  }
}
