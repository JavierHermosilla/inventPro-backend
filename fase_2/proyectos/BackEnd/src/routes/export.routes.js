// src/routes/export.routes.js
import { Router } from 'express'
import { verifyTokenMiddleware as requireAuth } from '../middleware/auth.middleware.js'
import {
  exportFullInventoryPDF,
  exportFullInventoryCSV,
  exportFullInventoryXLSX
} from '../controllers/export.controller.js'

const router = Router()

// Health (sin auth) para validar montaje
router.get('/ping', (req, res) => res.json({ ok: true }))

// Exports (con auth)
router.get('/full-inventory.pdf', requireAuth, exportFullInventoryPDF)
router.get('/full-inventory.csv', requireAuth, exportFullInventoryCSV) // ?mode=zip (default) | merged
router.get('/full-inventory.xlsx', requireAuth, exportFullInventoryXLSX)

export default router
