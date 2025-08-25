import { Router } from 'express'
import {
  createClient,
  listClients,
  listClientById,
  updateClient,
  deleteClient
} from '../controllers/clients.controller.js'
import { validateSchema } from '../middleware/validator.middleware.js'
import { createClientSchema, updateClientSchema } from '../schemas/client.schema.js'
import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'
import { validateUUID } from '../middleware/validateUUID.middleware.js'

const router = Router()
// Crear cliente -> solo admin

router.post(
  '/',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateSchema(createClientSchema),
  createClient
)
// Listar todos los clientes -> admin y bodeguero
router.get(
  '/',
  verifyTokenMiddleware,
  requireRole('admin', 'bodeguero'),
  listClients
)

// Obtener cliente por id -> admin y bodeguero
router.get(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin', 'bodeguero'),
  validateUUID('id'),
  listClientById
)

// Actualizar cliente -> solo admin
router.put(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateUUID('id'),
  validateSchema(updateClientSchema),
  updateClient
)

// Eliminar cliente -> solo admin
router.delete(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateUUID('id'),
  deleteClient
)

export default router
