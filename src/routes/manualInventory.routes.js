import { Router } from 'express'
import {
  createManualInventory,
  getAllManualInventories,
  manualInventoryById
} from '../controllers/manualInventory.controller.js'

import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'
import { validateSchema } from '../middleware/validator.middleware.js'
import { createManualInventorySchema } from '../schemas/manualInventory.schema.js'

const router = Router()

// Crear un ajuste manual de inventario - solo admin
router.post(
  '/',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateSchema(createManualInventorySchema),
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
  manualInventoryById
)

export default router
