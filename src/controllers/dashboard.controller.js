import { Op } from 'sequelize'
import Client from '../models/client.model.js'
import Order from '../models/order.model.js'
import Product from '../models/product.model.js'

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
        ? [{ model: Client, as: 'customer', attributes: ['id', 'name', 'email'] }]
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
