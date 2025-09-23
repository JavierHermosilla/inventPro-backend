import Order from '../models/order.model.js'

// Middleware para verificar si el usuario puede actualizar la orden
export const canUpdateOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id
    const order = await Order.findByPk(orderId)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    // Clientes pueden cancelar solo sus propias órdenes
    if (req.user.role !== 'admin') {
      if (req.body.status === 'cancelled' && order.customerId === req.user.id) {
        return next()
      }
      return res.status(403).json({ message: 'Only admins can update this order' })
    }

    // Admin puede continuar
    next()
  } catch (err) {
    console.error('Error in canUpdateOrder middleware:', err)
    res.status(500).json({ message: 'Internal server error', error: err.message })
  }
}
