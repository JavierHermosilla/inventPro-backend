import { Router } from 'express'
import { order, orderById, createOrder, updateOrder, deleteOrder } from '../controllers/order.controller.js'

const router = Router()

router.get('/', order)
router.get('/:id', orderById)
router.post('/', createOrder)
router.put('/:id', updateOrder)
router.delete('/:id', deleteOrder)

export default router
