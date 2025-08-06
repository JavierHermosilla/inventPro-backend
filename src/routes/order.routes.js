import { Router } from 'express'
import {
  listOrders,
  listOrderById,
  createOrder,
  updateOrder,
  deleteOrder
} from '../controllers/order.controller.js'
import { verifyToken } from '../middleware/auth.middleware.js'

const router = Router()

router.get(
  '/',
  verifyToken,
  listOrders
)
router.get(
  '/:id',
  verifyToken,
  listOrderById
)
router.post(
  '/',
  verifyToken,
  createOrder
)
router.put(
  '/:id',
  verifyToken,
  updateOrder
)
router.delete(
  '/:id',
  verifyToken,
  deleteOrder
)

export default router
