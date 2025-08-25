import ManualInventory from '../models/manualInventory.model.js'
import Product from '../models/product.model.js'
import User from '../models/user.model.js'

// Crear ajuste manual de inventario
export const createManualInventory = async (req, res) => {
  try {
    const { productId, type, quantity, reason } = req.body
    const userId = req.user.id

    // Verificar producto
    const product = await Product.findByPk(productId)
    if (!product) return res.status(404).json({ message: 'Product not found' })

    // Ajuste de stock
    if (type === 'decrease' && product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock to decrease' })
    }

    product.stock += type === 'increase' ? quantity : -quantity
    await product.save()

    // Crear ajuste
    const adjustment = await ManualInventory.create({
      productId,
      type,
      quantity,
      reason,
      userId
    })

    res.status(201).json({
      message: 'Inventory adjustment successful',
      product: { id: product.id, name: product.name, stock: product.stock },
      adjustment
    })
  } catch (err) {
    console.error(`[ERROR] createManualInventory: ${err.message}`)
    res.status(500).json({ message: 'Internal server error', error: err.message })
  }
}

// Listar todos los ajustes manuales
export const getAllManualInventories = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, productId, userId } = req.query
    const offset = (page - 1) * limit

    const where = {}
    if (type) where.type = type
    if (productId) where.productId = productId
    if (userId) where.userId = userId

    const { rows: records, count: total } = await ManualInventory.findAndCountAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name'] },
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: Number(offset)
    })

    res.json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      records
    })
  } catch (err) {
    console.error(`[ERROR] getAllManualInventories: ${err.message}`)
    res.status(500).json({ message: 'Internal server error', error: err.message })
  }
}

// Obtener ajuste manual por ID
export const manualInventoryById = async (req, res) => {
  try {
    const { id } = req.params

    const adjustment = await ManualInventory.findByPk(id, {
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name'] },
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }
      ]
    })

    if (!adjustment) return res.status(404).json({ message: 'Adjustment not found' })

    res.json(adjustment)
  } catch (err) {
    console.error(`[ERROR] manualInventoryById: ${err.message}`)
    res.status(500).json({ message: 'Internal server error', error: err.message })
  }
}

// Eliminar ajuste manual
export const deleteManualInventory = async (req, res) => {
  try {
    const { id } = req.params

    const adjustment = await ManualInventory.findByPk(id)
    if (!adjustment) return res.status(404).json({ message: 'Adjustment not found' })

    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })

    await adjustment.destroy()

    res.json({ message: 'Adjustment deleted successfully' })
  } catch (err) {
    console.error(`[ERROR] deleteManualInventory: ${err.message}`)
    res.status(500).json({ message: 'Internal server error', error: err.message })
  }
}
