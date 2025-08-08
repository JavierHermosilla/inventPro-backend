import { Router } from 'express'
import {
  createSupplier,
  listSuppliers,
  supplierById,
  updateSupplier,
  deleteSupplier
} from '../controllers/supplier.controller.js'

import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'
import { supplierSchema, updateSupplierSchema } from '../schemas/supplier.schema.js'
import { validateSchema } from '../middleware/validator.middleware.js'

const router = Router()

// rutas publicas
router.get('/', verifyTokenMiddleware, listSuppliers)
router.get('/:id', verifyTokenMiddleware, supplierById)

// rutas solo admin
router.post('/', verifyTokenMiddleware, requireRole('admin'), validateSchema(supplierSchema), createSupplier)
router.put('/:id', verifyTokenMiddleware, requireRole('admin'), validateSchema(updateSupplierSchema), updateSupplier)
router.delete('/:id', verifyTokenMiddleware, requireRole('admin'), deleteSupplier)

export default router
