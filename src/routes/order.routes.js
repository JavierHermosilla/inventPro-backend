import { Router } from 'express'
import {
  listOrders,
  listOrderById,
  createOrder,
  updateOrder,
  deleteOrder
} from '../controllers/order.controller.js'
import { verifyTokenMiddleware } from '../middleware/auth.middleware.js'

const router = Router()

router.get(
  '/',
  verifyTokenMiddleware,
  listOrders
)
router.get(
  '/:id',
  verifyTokenMiddleware,
  listOrderById
)
router.post(
  '/',
  verifyTokenMiddleware,
  createOrder
)
router.put(
  '/:id',
  verifyTokenMiddleware,
  updateOrder
)
router.delete(
  '/:id',
  verifyTokenMiddleware,
  deleteOrder
)

export default router
