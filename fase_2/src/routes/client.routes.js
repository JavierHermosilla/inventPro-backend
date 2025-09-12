// src/routes/client.routes.js
import { Router } from 'express'
import {
  createClient,
  listClients,
  listClientById,
  updateClient,
  deleteClient
} from '../controllers/clients.controller.js'

import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'
import { validateUUID } from '../middleware/validateUUID.middleware.js'
import { validateSchema } from '../middleware/validator.middleware.js'
import { createClientSchema, updateClientSchema } from '../schemas/client.schema.js'

const router = Router()

// 🔒 Todas las rutas requieren estar autenticado
router.use(verifyTokenMiddleware)

// Crear cliente → solo admin
router.post(
  '/',
  requireRole('admin'),
  validateSchema(createClientSchema),
  createClient
)

// Listar clientes → admin y bodeguero
router.get(
  '/',
  requireRole('admin', 'bodeguero'),
  listClients
)

// Obtener cliente por ID → admin y bodeguero
router.get(
  '/:id',
  requireRole('admin', 'bodeguero'),
  validateUUID('id'),
  listClientById
)

// Actualizar cliente → solo admin
router.put(
  '/:id',
  requireRole('admin'),
  validateUUID('id'),
  validateSchema(updateClientSchema),
  updateClient
)

// Eliminar cliente → solo admin
router.delete(
  '/:id',
  requireRole('admin'),
  validateUUID('id'),
  deleteClient
)

export default router
