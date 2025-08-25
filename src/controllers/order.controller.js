import sequelize from '../config/db.js'
import Order from '../models/order.model.js'
import OrderItem from '../models/orderItem.js'
import Product from '../models/product.model.js'
import { orderSchema, orderUpdateSchema } from '../schemas/order.schema.js'

// --------------------- CREATE ORDER ---------------------
export const createOrder = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const { customerId, products } = orderSchema.parse(req.body)

    if (!products || products.length === 0) {
      await t.rollback()
      return res.status(400).json({ message: 'At least one product is required' })
    }

    if (req.user.role !== 'admin' && req.user.id !== customerId) {
      await t.rollback()
      return res.status(403).json({ message: 'You can only create orders for yourself' })
    }

    let totalAmount = 0
    const orderItems = []

    for (const item of products) {
      const product = await Product.findByPk(item.productId, { transaction: t })
      if (!product) {
        await t.rollback()
        return res.status(404).json({ message: `Product ${item.productId} not found` })
      }

      if (product.stock < item.quantity) {
        await t.rollback()
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` })
      }

      product.stock -= item.quantity
      await product.save({ transaction: t })

      totalAmount += parseFloat(product.price) * item.quantity

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price
      })
    }

    const order = await Order.create(
      { customerId, totalAmount, status: 'pending', stockRestored: false },
      { transaction: t }
    )

    for (const oi of orderItems) {
      await OrderItem.create(
        { ...oi, orderId: order.id },
        { transaction: t }
      )
    }

    await t.commit()
    res.status(201).json({ orderId: order.id, totalAmount, status: order.status, products: orderItems })
  } catch (err) {
    await t.rollback()
    res.status(500).json({ message: err.message })
  }
}

// --------------------- LIST ORDERS ---------------------
export const listOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: OrderItem, as: 'products', include: [{ model: Product, as: 'product' }] }
      ],
      order: [['createdAt', 'DESC']]
    })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// --------------------- LIST ORDER BY ID ---------------------
export const listOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id,
      {
        include: [
          { model: OrderItem, as: 'products', include: [{ model: Product, as: 'product' }] }
        ]
      })
    if (!order) return res.status(404).json({ message: 'Order not found' })
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// --------------------- UPDATE ORDER ---------------------
export const updateOrder = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const order = await Order.findByPk(req.params.id, { include: [{ model: OrderItem, as: 'products' }], transaction: t })
    if (!order) {
      await t.rollback()
      return res.status(404).json({ message: 'Order not found' })
    }

    const { status, products } = orderUpdateSchema.parse(req.body)

    // solo admin puede cambiar productos o customers
    if (products && req.user.role !== 'admin') {
      await t.rollback()
      return res.status(403).json({ message: 'Only admins can change order products' })
    }

    // restaurar stock si se actualizan productos
    if (products) {
      for (const item of order.products) {
        const product = await Product.findByPk(item.productId, { transaction: t })
        product.stock += item.quantity
        await product.save({ transaction: t })
        await item.destroy({ transaction: t })
      }

      let totalAmount = 0
      for (const item of products) {
        const product = await Product.findByPk(item.productId, { transaction: t })
        if (!product || product.stock < item.quantity) {
          await t.rollback()
          return res.status(400).json({ message: `Invalid product or insufficient stock for ${item.productId}` })
        }

        product.stock -= item.quantity
        await product.save({ transaction: t })

        totalAmount += parseFloat(product.price) * item.quantity

        await OrderItem.create({
          orderId: order.id,
          productId: product.id,
          quantity: item.quantity,
          price: product.price
        }, { transaction: t })
        order.totalAmount = totalAmount
      }
    }
    if (status) order.status = status
    await order.save({ transaction: t })
    await t.commit()
    res.json({ message: 'Order updated', order })
  } catch (err) {
    await t.rollback()
    res.status(500).json({ message: err.message })
  }
}

// --------------------- DELETE ORDER ---------------------
export const deleteOrder = async (req, res) => {
  const t = await Order.sequelize.transaction()
  try {
    const order = await Order.findByPk(req.params.id, { include: [{ model: OrderItem, as: 'products' }], transaction: t })
    if (!order) {
      await t.rollback()
      return res.status(404).json({ message: 'Order not found' })
    }

    // Restaurar stock
    for (const item of order.products) {
      const product = await Product.findByPk(item.productId, { transaction: t })
      product.stock += item.quantity
      await product.save({ transaction: t })
    }

    await OrderItem.destroy({ where: { orderId: order.id }, transaction: t })
    await order.destroy({ transaction: t })

    await t.commit()
    res.json({ message: 'Order deleted and stock restored' })
  } catch (err) {
    await t.rollback()
    res.status(500).json({ message: err.message })
  }
}
