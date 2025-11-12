// src/routes/order.routes.js
import { Router } from 'express'
import {
  createOrder,
  updateOrder,
  deleteOrder,
  listOrderById,
  listOrders,
  createOrderByRut,
  listOrdersByRut,
  exportOrdersCSV,
  exportOrdersPDF,
  exportOrdersXLSX
} from '../controllers/order.controller.js'

import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'
import { validateUUID } from '../middleware/validateUUID.middleware.js'
import { validateSchema } from '../middleware/validator.middleware.js'
import { canUpdateOrder } from '../middleware/order.middleware.js'
import {
  orderCreateSchema,
  orderUpdateSchema,
  orderByRutSchema
} from '../schemas/order.schema.js'

const router = Router()

// 🔒 todas autenticadas
router.use(verifyTokenMiddleware)

// 🔎 Listar por RUT (antes de /:id)
router.get('/by-rut/:rut', requireRole('admin', 'vendedor', 'bodeguero'), listOrdersByRut)

// 📤 Exports (solo admin) — definir ANTES de '/:id'
router.get('/export.csv', requireRole('admin'), exportOrdersCSV)
router.get('/export.pdf', requireRole('admin'), exportOrdersPDF)
router.get('/export.xlsx', requireRole('admin'), exportOrdersXLSX)

// 🌐 Listar (lectura operativa)
router.get('/', requireRole('admin', 'vendedor', 'bodeguero'), listOrders)

// ➕ Crear (solo admin + vendedor)
router.post('/', requireRole('admin', 'vendedor'), validateSchema(orderCreateSchema), createOrder)

// ➕ Crear por RUT
router.post('/by-rut', requireRole('admin', 'vendedor'), validateSchema(orderByRutSchema), createOrderByRut)

// 📄 Obtener una orden
router.get('/:id', requireRole('admin', 'vendedor', 'bodeguero'), validateUUID('id'), listOrderById)

// ✏️ Actualizar estado (admin + bodeguero pueden avanzar estados)
router.patch('/:id', requireRole('admin', 'bodeguero'), validateUUID('id'), validateSchema(orderUpdateSchema), canUpdateOrder, updateOrder)

// 🗑️ Eliminar
router.delete('/:id', requireRole('admin'), validateUUID('id'), deleteOrder)

export default router
