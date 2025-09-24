import { Router } from 'express'
import {
  createManualInventory,
  getAllManualInventories,
  manualInventoryById,
  deleteManualInventory
} from '../controllers/manualInventory.controller.js'

import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'
import { validateSchema } from '../middleware/validator.middleware.js'
import { createManualInventorySchema } from '../schemas/manualInventory.schema.js'
import { validateUUID } from '../middleware/validateUUID.middleware.js'

const router = Router()

// Crear un ajuste manual de inventario - solo admin
router.post(
  '/',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateSchema(createManualInventorySchema),
  (req, res, next) => {
    console.log('Entré a manualInventoryRoutes')
    next()
  },
  createManualInventory
)

// Listar todos los ajustes manuales de inventario - solo admin
router.get(
  '/',
  verifyTokenMiddleware,
  requireRole('admin'),
  getAllManualInventories
)

// Obtener ajuste manual por ID - solo admin
router.get(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateUUID('id'),
  manualInventoryById
)

// Eliminar un ajuste manual de inventario - solo admin
router.delete(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateUUID('id'),
  deleteManualInventory
)

export default router
