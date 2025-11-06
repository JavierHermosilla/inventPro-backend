// src/routes/export.routes.js
import { Router } from 'express'
import { verifyTokenMiddleware as requireAuth } from '../middleware/auth.middleware.js'
// import { requireRole } from '../middleware/role.middleware.js' // ⬅️ opcional

import {
  exportFullInventoryPDF,
  exportFullInventoryCSV,
  exportFullInventoryXLSX
} from '../controllers/export.controller.js'

const router = Router()

// Health (sin auth) para validar montaje
router.get('/ping', (_req, res) => res.json({ ok: true }))

// Exports (con auth)
// Si quieres restringir a admin, descomenta requireRole('admin') en cada ruta.
router.get('/full-inventory.pdf', requireAuth, /* requireRole('admin'), */ exportFullInventoryPDF)
router.get('/full-inventory.csv', requireAuth, /* requireRole('admin'), */ exportFullInventoryCSV) // ?mode=merged (default) | zip | sep=;
router.get('/full-inventory.xlsx', requireAuth, /* requireRole('admin'), */ exportFullInventoryXLSX)

export default router
