export const dashboardData = async (req, res) => {
  try {
    // Acá puedes consultar tus colecciones para armar el resumen
    // Por ejemplo:
    // const totalUsers = await User.countDocuments()
    // const totalProducts = await Product.countDocuments()
    // const pendingOrders = await Order.find({ status: 'pendiente' })

    // Simulación temporal
    const data = {
      totalUser: 52,
      totalProducts: 118,
      totalOrders: 20,
      pendingOrders: 7,
      lowStockProducts: 4
    }
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Error al cargar el dshboard', err })
  }
}
