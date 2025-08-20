import Order from '../models/order.model.js'

export const canUpdateOrder = async (req, res, next) => {
  const order = await Order.findById(req.params.id)
  if (!order) return res.status(404).json({ message: 'Order not found' })

  // Cliente puede cancelar su propia orden
  if (req.user.role !== 'admin') {
    if (req.body.status === 'cancelled' && order.customerId.toString() === req.user.id) {
      return next()
    }
    return res.status(403).json({ message: 'Only admins can update this order' })
  }

  // Admin puede continuar
  next()
}
