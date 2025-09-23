import {
  createProductService,
  listProductsService,
  getProductByIdService,
  updateProductService,
  deleteProductService
} from '../services/product.service.js'
import logger from '../utils/logger.js'

export const createProduct = async (req, res) => {
  try {
    const newProduct = await createProductService(req.body)
    logger.info(`[AUDIT] user ${req.user.id} created product ${newProduct.id} (${newProduct.name}), IP: ${req.clientIP}`)
    res.status(201).json({ message: 'Product created successfully.', productId: newProduct.id })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'An error occurred while creating the product.' })
  }
}

export const products = async (req, res) => {
  try {
    const data = await listProductsService(req.query)
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'An error occurred while fetching the products.' })
  }
}

export const productById = async (req, res) => {
  try {
    const product = await getProductByIdService(req.params.id)
    res.json(product)
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'An error occurred while searching for the product.' })
  }
}

export const updateProduct = async (req, res) => {
  try {
    const product = await updateProductService(req.params.id, req.body)
    logger.info(`[AUDIT] user ${req.user.id} updated product ${product.id} (${product.name}), IP: ${req.clientIP}`)
    res.json({ message: 'Product updated successfully.', product })
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'An error occurred while updating the product.' })
  }
}

export const deleteProduct = async (req, res) => {
  try {
    const result = await deleteProductService(req.params.id)
    logger.info(`[AUDIT] user ${req.user.id} deleted product ${result.product.id} (${result.product.name}), IP: ${req.clientIP}`)
    res.json(result)
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || 'Error deleting product.' })
  }
}
