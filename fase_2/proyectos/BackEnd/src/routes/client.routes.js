// src/routes/client.routes.js
import { Router } from 'express'
import {
  createClient,
  listClients,
  listClientById,
  updateClient,
  deleteClient,
  exportClientsPDF,
  exportClientsXLSX
} from '../controllers/client.controller.js'

import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'
import { validateUUID } from '../middleware/validateUUID.middleware.js'
import { validateSchema } from '../middleware/validator.middleware.js'
import { createClientSchema, updateClientSchema } from '../schemas/client.schema.js'

const router = Router()

// 🔒 todas autenticadas
router.use(verifyTokenMiddleware)

// Exports (solo admin)
router.get('/export.pdf', requireRole('admin'), exportClientsPDF)
router.get('/export.xlsx', requireRole('admin'), exportClientsXLSX)

// Crear → admin
router.post('/', requireRole('admin'), validateSchema(createClientSchema), createClient)

// Listar / CSV (?export=csv) → admin y bodeguero
router.get('/', requireRole('admin', 'bodeguero'), listClients)

// Obtener por ID → admin y bodeguero
router.get('/:id', requireRole('admin', 'bodeguero'), validateUUID('id'), listClientById)

// Actualizar → admin
router.put('/:id', requireRole('admin'), validateUUID('id'), validateSchema(updateClientSchema), updateClient)

// Eliminar → admin
router.delete('/:id', requireRole('admin'), validateUUID('id'), deleteClient)

export default router
