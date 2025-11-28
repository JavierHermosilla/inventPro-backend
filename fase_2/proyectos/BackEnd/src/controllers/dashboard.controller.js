import { Op } from 'sequelize'
import Client from '../models/client.model.js'
import Order from '../models/order.model.js'
import Product from '../models/product.model.js'
import OrderProduct from '../models/orderProduct.model.js'

export const dashboardData = async (req, res) => {
  try {
    const role = req.user.role // asumimos que verifyTokenMiddleware añade req.user

    // Datos visibles para todos
    const lowStockProducts = await Product.findAll({
      where: { stock: { [Op.lt]: 10 } },
      order: [['stock', 'ASC']],
      limit: 5
    })

    const recentOrders = await Order.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: role === 'admin'
        ? [{ model: Client, as: 'client', attributes: ['id', 'name', 'email'] }]
        : [] // bodeguero no ve datos de cliente
    })

    // Datos solo para admin
    let totalClients, totalOrders, totalProducts
    if (role === 'admin') {
      totalClients = await Client.count()
      totalOrders = await Order.count()
      totalProducts = await Product.count()
    }

    res.json({
      totalClients: totalClients || undefined,
      totalOrders: totalOrders || undefined,
      totalProducts: totalProducts || undefined,
      lowStockProducts,
      recentOrders
    })
  } catch (err) {
    res.status(500).json({ message: 'Error interno del servidor', error: err.message })
  }
}

// Resumen compacto para panel
export const dashboardSummary = async (_req, res) => {
  try {
    const [
      totalClients,
      totalOrders,
      totalProducts,
      lowStockCount,
      pendingOrders,
      completedOrders,
      totalRevenue
    ] = await Promise.all([
      Client.count(),
      Order.count(),
      Product.count(),
      Product.count({ where: { stock: { [Op.lt]: 10 } } }),
      Order.count({ where: { status: 'pending' } }),
      Order.count({ where: { status: 'completed' } }),
      Order.sum('totalAmount')
    ])

    const topProducts = await OrderProduct.findAll({
      attributes: ['productId', [Order.sequelize.fn('SUM', Order.sequelize.col('quantity')), 'units']],
      group: ['productId'],
      order: [[Order.sequelize.literal('units'), 'DESC']],
      limit: 5,
      include: [{ model: Product, as: 'product', attributes: ['name', 'stock'] }]
    })

    res.json({
      totalClients,
      totalOrders,
      totalProducts,
      lowStockCount,
      pendingOrders,
      completedOrders,
      totalRevenue: totalRevenue ? Number(totalRevenue) : 0,
      topProducts
    })
  } catch (err) {
    res.status(500).json({ message: 'Error interno del servidor', error: err.message })
  }
}
