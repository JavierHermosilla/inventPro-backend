import mongoose from 'mongoose'
import Order from '../models/order.model.js'
import Product from '../models/product.model.js'
import { orderSchema, orderUpdateSchema } from '../schemas/order.schema.js'

// --------------------- Auxiliares ---------------------
const startSessionIfNeeded = async () => {
  if (process.env.NODE_ENV === 'test') return null
  const session = await mongoose.startSession()
  session.startTransaction()
  return session
}

const endSession = async (session, success = true) => {
  if (!session) return
  if (success) await session.commitTransaction()
  else await session.abortTransaction()
  session.endSession()
}

const restoreStock = async (products, session) => {
  for (const item of products) {
    const product = await Product.findById(item.productId).session(session)
    if (product) {
      product.stock += item.quantity
      await product.save(session ? { session } : {})
    }
  }
}

// --------------------- CREATE ORDER ---------------------
export const createOrder = async (req, res) => {
  let session = null
  try {
    session = await startSessionIfNeeded()

    const validation = orderSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({ message: 'Validation error', errors: validation.error.errors })
    }

    const { customerId, products } = validation.data

    // 🔹 Clientes solo pueden crear órdenes para sí mismos
    if (req.user.role !== 'admin' && req.user.id !== customerId) {
      return res.status(403).json({ message: 'You can only create orders for yourself' })
    }

    let totalAmount = 0
    const orderProducts = []

    for (const item of products) {
      const product = await Product.findById(item.productId).session(session)
      if (!product) return res.status(404).json({ message: `Product ${item.productId} not found` })
      if (product.stock < item.quantity) return res.status(400).json({ message: `Insufficient stock for ${product.name}` })

      product.stock -= item.quantity
      await product.save(session ? { session } : {})

      totalAmount += product.price * item.quantity
      orderProducts.push({ productId: product._id, quantity: item.quantity, price: product.price })
    }

    const order = new Order({
      customerId,
      products: orderProducts,
      totalAmount,
      stockRestored: false
    })

    await order.save(session ? { session } : {})
    await endSession(session, true)

    res.status(201).json(order)
  } catch (err) {
    await endSession(session, false)
    res.status(400).json({ message: err.message })
  }
}
// --------------------- LIST ORDERS ---------------------
export const listOrders = async (req, res) => {
  try {
    const orders = await Order.find()
    res.json(orders)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// --------------------- LIST ORDER BY ID ---------------------
export const listOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found' })
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// --------------------- UPDATE ORDER ---------------------
export const updateOrder = async (req, res) => {
  let session = null
  try {
    session = await startSessionIfNeeded()
    const { id } = req.params

    const validation = orderUpdateSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({ message: 'Validation error', errors: validation.error.errors })
    }

    const order = await Order.findById(id).session(session)
    if (!order) return res.status(404).json({ message: 'Order not found' })

    const { products, status, customerId } = validation.data

    // 🔹 Caso: cliente cancela su propia orden
    if (req.user.role !== 'admin') {
      if (status === 'cancelled' && order.customerId.toString() === req.user.id) {
        if (!order.stockRestored) await restoreStock(order.products, session)
        order.status = 'cancelled'
        order.stockRestored = true
        await order.save(session ? { session } : {})
        await endSession(session, true)
        return res.json(order)
      }
      return res.status(403).json({ message: 'Only admins can update this order' })
    }

    // 🔹 Caso: admin actualiza cualquier campo
    if (products) {
      if (!order.stockRestored) await restoreStock(order.products, session)
      let totalAmount = 0
      const updatedProducts = []

      for (const item of products) {
        const product = await Product.findById(item.productId).session(session)
        if (!product) return res.status(404).json({ message: `Product ${item.productId} not found` })
        if (product.stock < item.quantity) return res.status(400).json({ message: `Insufficient stock for ${product.name}` })

        product.stock -= item.quantity
        await product.save(session ? { session } : {})

        totalAmount += product.price * item.quantity
        updatedProducts.push({ productId: product._id, quantity: item.quantity, price: product.price })
      }

      order.products = updatedProducts
      order.totalAmount = totalAmount
      order.stockRestored = false
    }

    if (status) order.status = status
    if (customerId) order.customerId = customerId

    await order.save(session ? { session } : {})
    await endSession(session, true)
    res.json(order)
  } catch (err) {
    await endSession(session, false)
    res.status(400).json({ message: err.message })
  }
}

// --------------------- DELETE ORDER ---------------------
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params
    const order = await Order.findById(id)
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' })

    // Restaurar stock solo si no se ha restaurado
    if (!order.stockRestored) {
      await restoreStock(order.products)
      order.stockRestored = true
      await order.save() // guardar antes de borrar
    }

    await order.deleteOne()
    return res.json({ message: 'Orden eliminada y stock restaurado' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error eliminando la orden' })
  }
}
