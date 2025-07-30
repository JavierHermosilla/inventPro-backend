import { Router } from 'express'
import { listOrders, listOrderById, createOrder, updateOrder, deleteOrder } from '../controllers/order.controller.js'

const router = Router()

router.get('/', listOrders)
router.get('/:id', listOrderById)
router.post('/', createOrder)
router.put('/:id', updateOrder)
router.delete('/:id', deleteOrder)

export default router
