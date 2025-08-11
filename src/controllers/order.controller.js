import Order from '../models/order.model.js'
import { orderSchema, orderUpdateSchema } from '../schemas/order.schema.js'
import { ZodError } from 'zod'

import logger from '../utils/logger.js'
import User from '../models/user.model.js'
import Product from '../models/product.model.js'

export const createOrder = async (req, res) => {
  try {
    const userIP = req.clientIP // <--

    const result = orderSchema.safeParse(req.body)

    if (!result.success) {
      logger.warn('Validation failed in createOrder', { errors: result.error.errors, IP: userIP }) // <--
      return res.status(400).json({
        message: 'Validation failed',
        errors: result.error.errors
      })
    }

    const validatedData = result.data

    if (!validatedData.products || validatedData.products.length === 0) {
      logger.warn('No products provided in createOrder', { IP: userIP }) // <--
      return res.status(400).json({ message: 'At least one product is required' })
    }

    // verificacion de cliente existente
    const customer = await User.findById(validatedData.customerId)
    if (!customer) {
      logger.warn(`Customer not found: ${validatedData.customerId}`, { IP: userIP }) // <--
      return res.status(404).json({ message: 'Customer not found' })
    }

    // verificacion de productos existentes
    const productIds = validatedData.products.map(p => p.productId)
    const products = await Product.find({ _id: { $in: productIds } })

    if (products.length !== productIds.length) {
      logger.warn('One or more products are invalid in createOrder', { IP: userIP }) // <--
      return res.status(400).json({ message: 'One or more products are invalid' })
    }

    // validacion de stock y calculo del total
    const stockErrors = []
    let totalAmount = 0

    for (const item of validatedData.products) {
      const product = products.find(p => p._id.toString() === item.productId)
      if (!product) continue

      if (product.stock < item.quantity) {
        stockErrors.push(`Not enough stock for product: ${product.name}`)
      } else {
        totalAmount += product.price * item.quantity
      }
    }

    if (stockErrors.length > 0) {
      logger.warn('Stock errors in createOrder', { errors: stockErrors, IP: userIP }) // <--
      return res.status(400).json({ message: stockErrors })
    }

    const productCorrectPrice = validatedData.products.map(item => {
      const product = products.find(p => p._id.toString() === item.productId)
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price
      }
    })

    // descuento del stock y calculo del total
    for (const item of validatedData.products) {
      const product = products.find(p => p._id.toString() === item.productId)
      if (product) {
        product.stock -= item.quantity
        await product.save()
      }
    }

    const order = new Order({
      customerId: validatedData.customerId,
      products: productCorrectPrice,
      status: validatedData.status || 'pending',
      totalAmount
    })

    const savedOrder = await order.save()

    logger.info(`Order created successfully for customer ${customer._id}, totalAmount: ${totalAmount}, IP: ${userIP}`) // <--

    res.status(201).json(savedOrder)
  } catch (err) {
    const userIP = req.clientIP // <--
    logger.error('Error in createOrder', { message: err.message, stack: err.stack, IP: userIP }) // <--

    if (err instanceof ZodError) {
      return res.status(400).json({ message: err.errors.map(e => e.message) })
    }
    return res.status(500).json({ message: err.message || 'Internal Server Error' })
  }
}

export const listOrders = async (req, res) => {
  try {
    const userIP = req.clientIP // <--
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('customerId', 'name email')
      .populate('products.productId', 'name price stock')

    logger.info(`Orders listed by IP: ${userIP}`) // <--
    res.json(orders)
  } catch (err) {
    const userIP = req.clientIP // <--
    logger.error('Error in listOrders', { message: err.message, stack: err.stack, IP: userIP }) // <--
    res.status(500).json({ message: err.message })
  }
}

export const listOrderById = async (req, res) => {
  try {
    const userIP = req.clientIP // <--
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email')
      .populate('products.productId', 'name price stock')

    if (!order) {
      logger.warn(`Order not found by ID: ${req.params.id}`, { IP: userIP }) // <--
      return res.status(404).json({ message: 'Order not found' })
    }

    logger.info(`Order retrieved by ID: ${req.params.id}, IP: ${userIP}`) // <--

    res.json(order)
  } catch (err) {
    const userIP = req.clientIP // <--
    logger.error('Error in listOrderById', { message: err.message, stack: err.stack, IP: userIP }) // <--
    res.status(500).json({ message: err.message })
  }
}

export const updateOrder = async (req, res) => {
  const userIP = req.clientIP // <--
  logger.info(`Update order request by user ${req.user?.id}, order id: ${req.params.id}, IP: ${userIP}`, { body: req.body })

  try {
    const validatedData = orderUpdateSchema.parse(req.body)
    const orderId = req.params.id

    const order = await Order.findById(orderId)
    if (!order) {
      logger.warn(`Order not found in updateOrder: ${req.params.id}`, { IP: userIP })
      return res.status(404).json({ message: 'Order not found' })
    }

    // devolvemos stock a products anteriores
    const originalStatus = order.status
    const originalProducts = [...order.products]

    // envio de arreglo de product
    let newTotal = order.totalAmount
    let updatedProducts = []

    if (validatedData.products) {
      for (const item of order.products) {
        const product = await Product.findById(item.productId)
        if (product) {
          product.stock += item.quantity
          await product.save()
        }
      }
      const productIds = validatedData.products.map(p => p.productId)
      updatedProducts = await Product.find({ _id: { $in: productIds } })

      if (updatedProducts.length !== productIds.length) {
        return res.status(400).json({ message: 'One or more new products are invalid' })
      }

      const stockErrors = []
      newTotal = 0

      // resta de productos nuevos
      for (const item of validatedData.products) {
        const product = updatedProducts.find(p => p._id.toString() === item.productId)
        if (!product || product.stock < item.quantity) {
          stockErrors.push(`Not enough stock for product: ${product?.name}`)
        } else {
          newTotal += product.price * item.quantity
        }
      }

      if (stockErrors.length > 0) {
        return res.status(400).json({ message: stockErrors })
      }

      for (const item of validatedData.products) {
        const product = updatedProducts.find(p => p._id.toString() === item.productId)
        if (product) {
          product.stock -= item.quantity
          await product.save()
        }
      }

      order.products = validatedData.products.map(item => {
        const product = updatedProducts.find(p => p._id.toString() === item.productId)
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: product ? product.price : item.price
        }
      })

      order.totalAmount = newTotal
    }

    // validacion de transmicion de estado
    const validTransitions = {
      pending: ['processing', 'cancelled'],
      processing: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    }

    if (validatedData.status && validatedData.status !== order.status) {
      const allowedNextStates = validTransitions[order.status] || []
      if (!allowedNextStates.includes(validatedData.status)) {
        return res.status(400).json({
          message: `Invalid status transition from ${order.status}" to "${validatedData.status}`
        })
      }
      // validacion de rol
      if (req.user.role !== 'admin' && validatedData.status !== 'cancelled') {
        logger.warn(`Unauthorized status change attempt by user ${req.user.id} on order ${order._id}`, { IP: userIP })
        return res.status(403).json({ message: 'Only admins can change order status except to cancelled' })
      }

      if (
        validatedData.status === 'cancelled' &&
        !validatedData.products &&
        ['pending', 'processing'].includes(originalStatus)
      ) {
        for (const item of originalProducts) {
          const product = await Product.findById(item.productId)
          if (product) {
            product.stock += item.quantity
            await product.save()
          }
        }
      }

      order.status = validatedData.status
    }

    if (validatedData.customerId) {
      order.customerId = validatedData.customerId
    }

    order.updatedAt = new Date()
    const updatedOrder = await order.save()

    logger.info(`Order ${order._id} updated successfully by user ${req.user.id}, IP: ${userIP}`)

    res.json(updatedOrder)
  } catch (err) {
    logger.error('Error in updateOrder', { message: err.message, stack: err.stack, IP: userIP })
    if (err instanceof ZodError) {
      return res.status(400).json({ message: err.errors.map(e => e.message) })
    }
    res.status(500).json({ message: err.message })
  }
}

export const deleteOrder = async (req, res) => {
  try {
    const userIP = req.clientIP // <--
    const order = await Order.findById(req.params.id)
    if (!order) {
      logger.warn(`Order not found in deleteOrder: ${req.params.id}`, { IP: userIP })
      return res.status(404).json({ message: 'Order not found' })
    }

    // devolvemos el stock a los productos
    for (const item of order.products) {
      const product = await Product.findById(item.productId)
      if (product) {
        product.stock += item.quantity
        await product.save()
      }
    }

    // eliminamos orden
    await Order.findByIdAndDelete(req.params.id)
    logger.info(`Order ${req.params.id} deleted and stock restored successfully, IP: ${userIP}`)
    res.json({ message: 'Order deleted and stock restored successfully' })
  } catch (err) {
    const userIP = req.clientIP
    logger.error('Error in deleteOrder', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: err.message })
  }
}
