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
