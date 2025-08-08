import { Router } from 'express'
import { createManualInventory, getAllManualInventories, manualInventoryById } from '../controllers/manualInventory.controller.js'
import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'
import { validateSchema } from '../middleware/validator.middleware.js'
import { createManualInventorySchema } from '../schemas/manualInventory.schema.js'

const router = Router()

router.post(
  '/',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateSchema(createManualInventorySchema),
  createManualInventory

)
router.get(
  '/',
  verifyTokenMiddleware,
  requireRole('admin'),
  getAllManualInventories
)
router.get(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  manualInventoryById
)
export default router
