import Order from '../models/order.model.js'
import { orderSchema, orderUpdateSchema } from '../schemas/order.schema.js'
import { ZodError } from 'zod'

import User from '../models/user.model.js'
import Product from '../models/product.model.js'

export const createOrder = async (req, res) => {
  try {
    console.log('Request body:', req.body)

    const result = orderSchema.safeParse(req.body)
    console.log('Zod validation result:', result)

    if (!result.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: result.error.errors
      })
    }

    const validatedData = result.data
    console.log('Validated data:', validatedData)

    if (!validatedData.products || validatedData.products.length === 0) {
      console.log('No products provieded')
      return res.status(400).json({ message: 'At least one product is required' })
    }

    // verificacion de cliente existente
    const customer = await User.findById(validatedData.customerId)
    console.log('Customer found:', customer)
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    // verificacion de productos existentes
    const productIds = validatedData.products.map(p => p.productId)
    console.log('Product IDs:', productIds)
    const products = await Product.find({ _id: { $in: productIds } })
    console.log('Products fetched from DB:', products)

    if (products.length !== productIds.length) {
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
      console.log('Stock errors:', stockErrors)
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
        console.log(`Updated stock for product ${product.name}: ${product.stock}`)
      }
    }

    const order = new Order({
      customerId: validatedData.customerId,
      products: productCorrectPrice,
      status: validatedData.status || 'pending',
      totalAmount
    })

    const savedOrder = await order.save()
    console.log('Order saved:', savedOrder)

    res.status(201).json(savedOrder)
  } catch (err) {
    console.error('Error in createOrder:', err)
    console.error(err.stack) // 👈 Añade esto para ver la traza del error

    if (err instanceof ZodError) {
      return res.status(400).json({ message: err.errors.map(e => e.message) })
    }
    return res.status(500).json({ message: err.message || 'Internal Server Error' })
  }
}

export const listOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('customerId', 'name email')
      .populate('products.productId', 'name price stock')
    res.json(orders)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const listOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email')
      .populate('products.productId', 'name price stock')

    if (!order) return res.status(404).json({ message: 'Order not found' })
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const updateOrder = async (req, res) => {
  console.log('req.user:', req.user)
  console.log('Updating order with id:', req.params.id)
  try {
    const validatedData = orderUpdateSchema.parse(req.body)
    const orderId = req.params.id

    const order = await Order.findById(orderId)
    if (!order) {
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

    res.json(updatedOrder)
  } catch (err) {
    console.error('Error in updateOrder:', err)
    if (err instanceof ZodError) {
      return res.status(400).json({ message: err.errors.map(e => e.message) })
    }
    res.status(500).json({ message: err.message })
  }
}

export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found' })

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
    res.json({ message: 'Order deleted and stock restored seccessfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
