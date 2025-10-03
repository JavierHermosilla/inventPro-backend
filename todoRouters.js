auth.routes.js:
// src/routes/auth.routes.js
import { Router } from 'express'
import {
  login,
  register,
  logout,
  profile,
  refresh
} from '../controllers/auth.controller.js'

import { validateSchema } from '../middleware/validator.middleware.js'
import { registerSchema, loginSchema } from '../schemas/auth.schema.js'
import { verifyTokenMiddleware } from '../middleware/auth.middleware.js'
import { loginRateLimiter, registerLimiter } from '../middleware/rateLimit.js'

const router = Router()

// Registro (rate limit + validación)
router.post('/register', registerLimiter, validateSchema(registerSchema), register)

// Login (rate limit + validación)
router.post('/login', loginRateLimiter, validateSchema(loginSchema), login)

// Refresh silencioso (usa cookie httpOnly "refresh_token"; SIN rate limit)
router.post('/refresh', refresh)

// Perfil (requiere access token válido)
router.get('/profile', verifyTokenMiddleware, profile)

// Logout (recomendado: requiere access token válido para cortar la sesión actual)
router.post('/logout', verifyTokenMiddleware, logout)

export default router
category.routes.js:
import { Router } from 'express'
import {
  createCategory,
  listCategories,
  listCategoryById,
  updateCategory,
  deleteCategory
} from '../controllers/category.controller.js'
import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'
import { validateSchema } from '../middleware/validator.middleware.js'
import { categorySchema } from '../schemas/category.schema.js'

const router = Router()

// Crear categoría (solo admin)
router.post(
  '/',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateSchema(categorySchema),
  createCategory
)

// Listar categorías
router.get(
  '/',
  verifyTokenMiddleware,
  listCategories
)

// Obtener categoría por ID
router.get(
  '/:id',
  verifyTokenMiddleware,
  listCategoryById
)

// Actualizar categoría (solo admin)
router.put(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateSchema(categorySchema.partial()),
  updateCategory
)

// Eliminar categoría (solo admin)
router.delete(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  deleteCategory
)

export default router
client.routes.js:
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
dashboard.routes.js:

import { Router } from 'express'
import { dashboardData } from '../controllers/dashboard.controller.js'
import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

router.get(
  '/',
  verifyTokenMiddleware,
  requireRole('admin', 'bodeguero'),
  dashboardData
)

export default router
manualInventory.routes.js:
import { Router } from 'express'
import {
  createManualInventory,
  getAllManualInventories,
  manualInventoryById,
  deleteManualInventory
} from '../controllers/manualInventory.controller.js'

import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'
import { validateSchema } from '../middleware/validator.middleware.js'
import { createManualInventorySchema } from '../schemas/manualInventory.schema.js'
import { validateUUID } from '../middleware/validateUUID.middleware.js'

const router = Router()

// Crear un ajuste manual de inventario - solo admin
router.post(
  '/',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateSchema(createManualInventorySchema),
  (req, res, next) => {
    console.log('Entré a manualInventoryRoutes')
    next()
  },
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
  validateUUID('id'),
  manualInventoryById
)

// Eliminar un ajuste manual de inventario - solo admin
router.delete(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateUUID('id'),
  deleteManualInventory
)

export default router
order.routes.js: 
// src/routes/order.routes.js
import { Router } from 'express'
import {
  createOrder,
  updateOrder,
  deleteOrder,
  listOrderById,
  listOrders,
  createOrderByRut,
  listOrdersByRut
} from '../controllers/order.controller.js'

import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'
import { validateUUID } from '../middleware/validateUUID.middleware.js'
import { validateSchema } from '../middleware/validator.middleware.js'

import {
  orderCreateSchema,
  orderUpdateSchema,
  orderByRutSchema
} from '../schemas/order.schema.js'

const router = Router()

// Listar todas las órdenes (auth requerido)
router.get('/', verifyTokenMiddleware, listOrders)

// Listar órdenes por RUT de cliente (poner antes de '/:id')
router.get(
  '/by-rut/:rut',
  verifyTokenMiddleware,
  requireRole('admin', 'vendedor', 'bodeguero'),
  listOrdersByRut
)

// Crear orden (acepta clientId o customerId; el schema normaliza)
router.post(
  '/',
  verifyTokenMiddleware,
  validateSchema(orderCreateSchema),
  createOrder
)

// Crear orden por RUT de cliente
router.post(
  '/by-rut',
  verifyTokenMiddleware,
  requireRole('admin', 'vendedor'),
  validateSchema(orderByRutSchema),
  createOrderByRut
)

// Obtener una orden por ID
router.get(
  '/:id',
  verifyTokenMiddleware,
  validateUUID('id'),
  listOrderById
)

// Actualizar orden (solo status) — PATCH
router.patch(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateUUID('id'),
  validateSchema(orderUpdateSchema),
  updateOrder
)

// Eliminar orden
router.delete(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateUUID('id'),
  deleteOrder
)

export default router
orderProduct.routes.js: 
}// src/routes/orderProduct.routes.js
import { Router } from 'express'
import {
  createOrderProduct,
  updateOrderProduct,
  deleteOrderProduct
} from '../controllers/orderProduct.controller.js'

import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'
import { validateUUID } from '../middleware/validateUUID.middleware.js'
import {
  createOrderProductSchema,
  updateOrderProductSchema
} from '../schemas/orderProduct.schema.js'
import { validateSchema } from '../middleware/validator.middleware.js'

const router = Router()

// Crear item → solo admin
router.post(
  '/',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateSchema(createOrderProductSchema),
  createOrderProduct
)

// Actualizar cantidad (PUT) → solo admin
router.put(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateUUID('id'),
  validateSchema(updateOrderProductSchema),
  updateOrderProduct
)

// Alias PATCH por compatibilidad de clientes → solo admin
router.patch(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateUUID('id'),
  validateSchema(updateOrderProductSchema),
  updateOrderProduct
)

// Eliminar item → solo admin
router.delete(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateUUID('id'),
  deleteOrderProduct
)

export default router
product.routes.js: 
import { Router } from 'express'
import { createProduct, products, productById, updateProduct, deleteProduct } from '../controllers/product.controller.js'
import { validateSchema } from '../middleware/validator.middleware.js'
import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'
import { validateUUID } from '../middleware/validateUUID.middleware.js'
import { productSchema, productUpdateSchema } from '../schemas/product.schema.js'

const router = Router()

// Rutas públicas: listar productos y obtener producto por ID
router.get('/', products) // listar productos paginados
router.get('/:id', validateUUID('id'), productById) // obtener producto por id

// Rutas protegidas: solo admin puede crear, actualizar o eliminar productos
router.post(
  '/',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateSchema(productSchema),
  createProduct
)

router.put(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateUUID('id'),
  validateSchema(productUpdateSchema),
  updateProduct
)

router.delete(
  '/:id',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateUUID('id'),
  deleteProduct
)

export default router
reports.routes.js: 
import express from 'express'
import {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport
} from '../controllers/reports.controller.js'

import {
  verifyTokenMiddleware,
  requireRole
} from '../middleware/auth.middleware.js'

import { ADMIN_ROLES } from '../config/roles.js'
const router = express.Router()

// =====================
// Rutas para reportes
// =====================

// Crear un reporte → Solo admins
router.post(
  '/',
  verifyTokenMiddleware,
  requireRole(...ADMIN_ROLES),
  createReport
)

// Listar todos los reportes → Todos los usuarios autenticados
router.get(
  '/',
  verifyTokenMiddleware,
  getReports
)

// Obtener un reporte por ID → Todos los usuarios autenticados
router.get(
  '/:id',
  verifyTokenMiddleware,
  getReportById
)

// Actualizar un reporte → Solo admins
router.put(
  '/:id',
  verifyTokenMiddleware,
  requireRole(...ADMIN_ROLES),
  updateReport
)

// Eliminar un reporte (soft delete) → Solo admins
router.delete(
  '/:id',
  verifyTokenMiddleware,
  requireRole(...ADMIN_ROLES),
  deleteReport
)

export default router
supplier.routes.js:
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
user.routes.js: 
import { Router } from 'express'
import {
  listUsers,
  updateUser,
  deleteUser,
  createUser,
  getUserById
} from '../controllers/user.controller.js'

import { verifyTokenMiddleware, requireRole, requireRoleOrSelf } from '../middleware/auth.middleware.js'
import { createUserSchema, updateUserSchema } from '../schemas/user.schema.js'
import { validateSchema } from '../middleware/validator.middleware.js'
import { validateUUID } from '../middleware/validateUUID.middleware.js'
import { checkUserUniqueness } from '../middleware/checkUserUniqueness.js'

const router = Router()

// Crear usuario (solo admin)
router.post(
  '/',
  verifyTokenMiddleware,
  requireRole('admin'),
  validateSchema(createUserSchema),
  checkUserUniqueness,
  createUser
)

// Listar todos (solo admin)
router.get(
  '/',
  verifyTokenMiddleware,
  requireRole('admin'),
  listUsers
)

// 👇 Ver usuario por id (admin o el mismo usuario)
router.get(
  '/:id',
  verifyTokenMiddleware,
  validateUUID('id'),
  requireRoleOrSelf('admin'),
  getUserById
)

// 👇 Actualizar usuario (admin o el mismo usuario)
router.put(
  '/:id',
  verifyTokenMiddleware,
  validateUUID('id'),
  requireRoleOrSelf('admin'),
  validateSchema(updateUserSchema),
  checkUserUniqueness,
  updateUser
)

// Eliminar (solo admin)
router.delete(
  '/:id',
  verifyTokenMiddleware,
  validateUUID('id'),
  requireRole('admin'),
  deleteUser
)

export default router
