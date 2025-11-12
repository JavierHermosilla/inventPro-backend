// src/routes/export.routes.js
import { Router } from 'express'
import { verifyTokenMiddleware as requireAuth, requireRole } from '../middleware/auth.middleware.js'

import {
  exportFullInventoryPDF,
  exportFullInventoryCSV,
  exportFullInventoryXLSX
} from '../controllers/export.controller.js'

const router = Router()

// Health (sin auth) para validar montaje
router.get('/ping', (_req, res) => res.json({ ok: true }))

// Exports (con auth + rol admin)
router.get('/full-inventory.pdf', requireAuth, requireRole('admin'), exportFullInventoryPDF)
router.get('/full-inventory.csv', requireAuth, requireRole('admin'), exportFullInventoryCSV) // ?mode=merged (default) | zip | sep=;
router.get('/full-inventory.xlsx', requireAuth, requireRole('admin'), exportFullInventoryXLSX)

export default router