import Product from '../models/product.model.js'
import ManualInventory from '../models/manualInventory.model.js'

export const createManualInventory = async (req, res) => {
  try {
    const { productId, type, quantity, reason } = req.body
    const userId = req.user.id

    // verificacion de el product
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    // ajuste del stock
    if (type === 'increase') {
      product.stock += quantity
    } else if (type === 'decrease') {
      if (product.stock < quantity) {
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

    console.log(`[AUDIT] Admin ${req.user.name} (${userId}) ${type === 'increase' ? 'added' : 'removed'} ${quantity} units of ${product.name} (ID: ${product._id}). New stock: ${product.stock}`)

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
    console.error('[ERROR] createManualInventory:', err)
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
    console.error('[ERROR] getAllManualInventories:', err)
    res.status(500).json({ message: 'internal server error' })
  }
}
export const manualInventoryById = async (req, res) => {
  try {
    const { id } = req.params
    const adjustment = await ManualInventory.findById(id)
      .populate('productId', 'name')
      .populate('userId', 'name email role')

    if (!adjustment) {
      return res.status(404).json({ message: 'Adjustment not found' })
    }

    res.status(200).json(adjustment)
  } catch (err) {
    console.error('[ERROR] getManualInventoryById:', err)
    res.status(500).json({ message: 'Internal server error' })
  }
}
