// src/routes/supplier.routes.js
import { Router } from 'express'
import {
  createSupplier,
  listSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier
} from '../controllers/supplier.controller.js'

import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'
import { supplierSchema, updateSupplierSchema } from '../schemas/supplier.schema.js'
import { validateSchema } from '../middleware/validator.middleware.js'
import { validateUUID } from '../middleware/validateUUID.middleware.js'

const router = Router()

// rutas protegidas
router.get('/', verifyTokenMiddleware, listSuppliers)
router.get('/:id', verifyTokenMiddleware, validateUUID('id'), getSupplierById)

// rutas solo admin
router.post('/', verifyTokenMiddleware, requireRole('admin'), validateSchema(supplierSchema), createSupplier)
router.put('/:id', verifyTokenMiddleware, requireRole('admin'), validateUUID('id'), validateSchema(updateSupplierSchema), updateSupplier)
router.delete('/:id', verifyTokenMiddleware, requireRole('admin'), validateUUID('id'), deleteSupplier)

export default router
