// src/controllers/orderProduct.controller.js
import { sequelize, models } from '../models/index.js'
import {
  createOrderProductSchema,
  updateOrderProductSchema,
  orderProductIdSchema
} from '../schemas/orderProduct.schema.js'

const { OrderProduct, Order, Product } = models

// --------------------- CREATE ORDERPRODUCT ---------------------
export const createOrderProduct = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    // Valida y NO permite "price" gracias al .strict() del schema
    const { orderId, productId, quantity } = createOrderProductSchema.parse(req.body)

    // Verifica existencia de Order y Product
    const order = await Order.findByPk(orderId, { transaction: t })
    if (!order) { await t.rollback(); return res.status(404).json({ error: 'Order no encontrado' }) }

    const product = await Product.findByPk(productId, { transaction: t })
    if (!product) { await t.rollback(); return res.status(404).json({ error: 'Product no encontrado' }) }

    // Copia el precio desde Product (ignora cualquier input del cliente)
    const price = product.price
    const newOrderProduct = await OrderProduct.create({ orderId, productId, quantity, price }, { transaction: t })

    // Actualiza total de la orden
    const lineTotal = Number(price) * Number(quantity)
    await order.update({ totalAmount: Number(order.totalAmount || 0) + lineTotal }, { transaction: t })

    await t.commit()
    return res.status(201).json({ message: 'OrderProduct creado', data: newOrderProduct })
  } catch (error) {
    await t.rollback()
    if (error.name === 'ZodError') return res.status(400).json({ errors: error.errors })
    console.error(error)
    return res.status(500).json({ error: 'Error al crear OrderProduct' })
  }
}

// --------------------- GET ALL ORDERPRODUCTS ---------------------
export const getAllOrderProducts = async (req, res) => {
  try {
    const { orderId } = req.query
    const whereClause = orderId ? { orderId } : {}

    const orderProducts = await OrderProduct.findAll({
      where: whereClause,
      include: [
        { model: Order, as: 'order' },
        { model: Product, as: 'product' }
      ],
      order: [['createdAt', 'DESC']]
    })

    return res.json({ data: orderProducts })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Error al obtener OrderProducts' })
  }
}

// --------------------- GET ORDERPRODUCT BY ID ---------------------
export const getOrderProductById = async (req, res) => {
  try {
    const { id } = orderProductIdSchema.parse(req.params)

    const orderProduct = await OrderProduct.findByPk(id, {
      include: [
        { model: Order, as: 'order' },
        { model: Product, as: 'product' }
      ]
    })

    if (!orderProduct) return res.status(404).json({ error: 'OrderProduct no encontrado' })

    return res.json({ data: orderProduct })
  } catch (error) {
    if (error.name === 'ZodError') return res.status(400).json({ errors: error.errors })
    console.error(error)
    return res.status(500).json({ error: 'Error al obtener OrderProduct' })
  }
}

// --------------------- UPDATE ORDERPRODUCT ---------------------
export const updateOrderProduct = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const { id } = orderProductIdSchema.parse(req.params)
    const data = updateOrderProductSchema.parse(req.body)

    const orderProduct = await OrderProduct.findByPk(id, { transaction: t })
    if (!orderProduct) {
      await t.rollback()
      return res.status(404).json({ error: 'OrderProduct no encontrado' })
    }

    await orderProduct.update(data, { transaction: t })
    await t.commit()

    return res.json({ message: 'OrderProduct actualizado', data: orderProduct })
  } catch (error) {
    await t.rollback()
    if (error.name === 'ZodError') return res.status(400).json({ errors: error.errors })
    console.error(error)
    return res.status(500).json({ error: 'Error al actualizar OrderProduct' })
  }
}

// --------------------- DELETE ORDERPRODUCT ---------------------
export const deleteOrderProduct = async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const { id } = orderProductIdSchema.parse(req.params)

    const orderProduct = await OrderProduct.findByPk(id, { transaction: t })
    if (!orderProduct) {
      await t.rollback()
      return res.status(404).json({ error: 'OrderProduct no encontrado' })
    }

    await orderProduct.destroy({ transaction: t })
    await t.commit()

    return res.json({ message: 'OrderProduct eliminado' })
  } catch (error) {
    await t.rollback()
    if (error.name === 'ZodError') return res.status(400).json({ errors: error.errors })
    console.error(error)
    return res.status(500).json({ error: 'Error al eliminar OrderProduct' })
  }
}
