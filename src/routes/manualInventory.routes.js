import { Router } from 'express'
import { createManualInventory, getAllManualInventories, manualInventoryById } from '../controllers/manualInventory.controller.js'
import { verifyToken, requireRole } from '../middleware/auth.middleware.js'
import { validateSchema } from '../middleware/validator.middleware.js'
import { createManualInventorySchema } from '../schemas/manualInventory.schema.js'

const router = Router()

router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  validateSchema(createManualInventorySchema),
  createManualInventory

)
router.get(
  '/',
  verifyToken,
  requireRole('admin'),
  getAllManualInventories
)
router.get(
  '/:id',
  verifyToken,
  requireRole('admin'),
  manualInventoryById
)
export default router
