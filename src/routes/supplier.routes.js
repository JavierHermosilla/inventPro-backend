import { Router } from 'express'
import {
  createSupplier,
  listSuppliers,
  supplierById,
  updateSupplier,
  deleteSupplier
} from '../controllers/supplier.controller.js'

import { verifyToken, requireRole } from '../middleware/auth.middleware.js'
import { supplierSchema, updateSupplierSchema } from '../schemas/suppleir.schema.js'
import { validateSchema } from '../middleware/validator.middleware.js'

const router = Router()

// rutas publicas
router.get('/', verifyToken, listSuppliers)
router.get('/:id', verifyToken, supplierById)

// rutas solo admin
router.post('/', verifyToken, requireRole('admin'), validateSchema(supplierSchema), createSupplier)
router.put('/:id', verifyToken, requireRole('admin'), validateSchema(updateSupplierSchema), updateSupplier)
router.delete('/:id', verifyToken, requireRole('admin'), deleteSupplier)

export default router
