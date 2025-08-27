import { Router } from 'express'
import {
  createOrderProduct,
  getAllOrderProducts,
  getOrderProductById,
  updateOrderProduct,
  deleteOrderProduct
} from '../controllers/orderProduct.controller.js'

const router = Router()

// Crear un OrderProduct
router.post('/', createOrderProduct)

// Obtener todos los OrderProducts (opcional filtro por orderId)
router.get('/', getAllOrderProducts)

// Obtener un OrderProduct por ID
router.get('/:id', getOrderProductById)

// Actualizar un OrderProduct por ID
router.put('/:id', updateOrderProduct)

// Eliminar un OrderProduct por ID
router.delete('/:id', deleteOrderProduct)

export default router
