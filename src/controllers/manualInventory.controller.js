import mongoose from 'mongoose'
import Product from '../models/product.model.js'
import ManualInventory from '../models/manualInventory.model.js'
import logger from '../utils/logger.js'

export const createManualInventory = async (req, res) => {
  try {
    const { productId, type, quantity, reason } = req.body
    const userId = req.user.id
    const userIP = req.clientIP

    // verificacion de el product
    const product = await Product.findById(productId)
    if (!product) {
      logger.warn(`ManualInventory creation failed: Product not found. productId: ${productId}, userId: ${userId}, IP: ${userIP}`)
      return res.status(404).json({ message: 'Product not found' })
    }

    // ajuste del stock
    if (type === 'increase') {
      product.stock += quantity
    } else if (type === 'decrease') {
      if (product.stock < quantity) {
        logger.warn(`ManualInventory creation failed: Insufficient stock. productId: ${productId}, userId: ${userId}, requested: ${quantity}, available: ${product.stock}, IP: ${userIP}`) // <--
        return res.status(400).json({ message: 'Insufficient stock to decrease' })
      }
      product.stock -= quantity
    }

    await product.save()

    const adjustment = await ManualInventory.create({
      productId,
      type,
      quantity,
      reason,
      userId
    })

    logger.info(`[AUDIT] Admin ${req.user.name} (${userId}) ${type === 'increase' ? 'added' : 'removed'} ${quantity} units of ${product.name} (ID: ${product._id}). New stock: ${product.stock}. IP: ${userIP}`) // <--

    res.status(201).json({
      message: 'Inventory adjustment successful',
      product: {
        _id: product._id,
        name: product.name,
        stock: product.stock
      },
      adjustment
    })
  } catch (err) {
    logger.error(`[ERROR] createManualInventory: ${err.message}`, { stack: err.stack })
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const getAllManualInventories = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, productId, userId } = req.query

    const pageNumber = Math.max(Number(page), 1)
    const limitNumber = Math.max(Number(limit), 1)

    const filters = {}

    if (type) filters.type = type
    if (productId) filters.productId = productId
    if (userId) filters.userId = userId

    const total = await ManualInventory.countDocuments(filters)

    const records = await ManualInventory.find(filters)
      .populate('productId', 'name')
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)

    res.status(200).json({
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      records
    })
  } catch (err) {
    logger.error(`[ERROR] getAllManualInventories: ${err.message}`, { stack: err.stack })
    res.status(500).json({ message: 'internal server error' })
  }
}

export const manualInventoryById = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID' })
    }

    const adjustment = await ManualInventory.findById(id)
      .populate('productId', 'name')
      .populate('userId', 'name email role')

    if (!adjustment) {
      return res.status(404).json({ message: 'Adjustment not found' })
    }

    res.status(200).json(adjustment)
  } catch (err) {
    logger.error(`[ERROR] manualInventoryById: ${err.message}`, { stack: err.stack })
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const deleteManualInventory = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID' })
    }

    const adjustment = await ManualInventory.findById(id)
    if (!adjustment) {
      return res.status(404).json({ message: 'Adjustment not found' })
    }

    // Solo admin puede eliminar ajustes
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' })
    }

    await adjustment.deleteOne()

    res.status(200).json({ message: 'Adjustment deleted successfully' })
  } catch (err) {
    logger.error(`[ERROR] deleteManualInventory: ${err.message}`, { stack: err.stack })
    res.status(500).json({ message: 'Internal server error' })
  }
}
