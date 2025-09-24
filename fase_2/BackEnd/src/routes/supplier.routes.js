// src/routes/supplier.routes.js
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
import { validateUUID } from '../middleware/validateUUID.middleware.js' // 👈 agrega esto

const router = Router()

// rutas protegidas
router.get('/', verifyTokenMiddleware, listSuppliers)
router.get('/:id', verifyTokenMiddleware, validateUUID('id'), supplierById)

// rutas solo admin
router.post('/', verifyTokenMiddleware, requireRole('admin'), validateSchema(supplierSchema), createSupplier)
router.put('/:id', verifyTokenMiddleware, requireRole('admin'), validateUUID('id'), validateSchema(updateSupplierSchema), updateSupplier) // 👈 valida UUID
router.delete('/:id', verifyTokenMiddleware, requireRole('admin'), validateUUID('id'), deleteSupplier) // 👈 valida UUID

export default router
