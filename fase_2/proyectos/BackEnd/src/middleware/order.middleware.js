// src/middleware/order.middleware.js
import Order from '../models/order.model.js'

/**
 * Solo admin o bodeguero pueden actualizar órdenes.
 * (Extensible: si en el futuro quieres permitir que "vendedor" cancele,
 *  añade una regla basada en createdBy o similar.)
 */
export const canUpdateOrder = async (req, res, next) => {
  try {
    const { id } = req.params
    const nextStatus = req.body?.status
    const role = req.user?.role

    const order = await Order.findByPk(id, {
      attributes: ['id', 'clientId', 'status']
    })
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    // Solo admin o bodeguero pueden actualizar
    if (!['admin', 'bodeguero'].includes(role)) {
      return res.status(403).json({ message: 'Only admins or bodegueros can update orders' })
    }

    // Solo admin puede anular (cancelled)
    if (nextStatus === 'cancelled' && role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can cancel orders' })
    }

    // Bodega solo pasa órdenes a "processing" desde "pending"
    if (role === 'bodeguero') {
      if (nextStatus !== 'processing') {
        return res.status(403).json({ message: 'Bodegueros solo pueden mover órdenes a proceso' })
      }
      if (order.status !== 'pending') {
        return res.status(403).json({ message: 'La orden debe estar pendiente para que bodega la pase a proceso' })
      }
    }

    // Si mandan el mismo status, evitamos trabajo innecesario (opcional)
    if (nextStatus && nextStatus === order.status) {
      return res.status(200).json({ message: 'No changes applied (same status)', order })
    }

    return next()
  } catch (err) {
    console.error('Error in canUpdateOrder middleware:', err)
    res.status(500).json({ message: 'Internal server error', error: err.message })
  }
}
