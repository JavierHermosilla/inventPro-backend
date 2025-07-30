import Order from '../models/order.model.js'
import { orderSchema, orderUpdateSchema } from '../schemas/order.schema.js'
import { ZodError } from 'zod'

import User from '../models/user.model.js'
import Product from '../models/product.model.js'

export const createOrder = async (req, res) => {
  try {
    const validatedData = orderSchema.parse(req.body)

    // verificacion de cliente existente
    const customerExists = await User.findById(validatedData.customerId)
    if (!customerExists) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    // verificacion de productos existentes
    const productIds = validatedData.products.map(p => p.productId)
    const existingProducts = await Product.find({ _id: { $in: productIds } })

    if (existingProducts.length !== productIds.length) {
      return res.status(400).json({ message: 'One or more products are invalid' })
    }

    const totalAmount = validatedData.products.reduce((acc, item) => {
      const product = existingProducts.find(p => p._id.toString() === item.productId)
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`)
      }
      return acc + item.price * item.quantity
    }, 0)

    const newOrder = new Order({
      ...validatedData,
      totalAmount
    })

    const savedOrder = await newOrder.save()

    res.status(201).json(savedOrder)
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ message: err.errors.map(e => e.message) })
    }
    res.status(500).json({ message: err.message })
  }
}

export const listOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('customerId products.productId')
    res.json(orders)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const listOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customerId products.productId')
    if (!order) return res.status(404).json({ message: 'Order not found' })
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const updateOrder = async (req, res) => {
  try {
    const validatedData = orderUpdateSchema.parse(req.body)
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, validatedData, { new: true })
    if (!updatedOrder) return res.status(404).json({ message: 'Order not found' })
    res.json(updatedOrder)
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ message: err.errors.map(e => e.message) })
    }
    res.status(500).json({ message: err.message })
  }
}

export const deleteOrder = async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id)
    if (!deletedOrder) return res.status(404).json({ message: 'Order not found' })
    res.json({ message: 'Order deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
