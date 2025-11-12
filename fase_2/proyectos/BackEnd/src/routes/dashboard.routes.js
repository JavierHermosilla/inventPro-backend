// src/routes/dashboard.routes.js
import { Router } from 'express'
import { dashboardData } from '../controllers/dashboard.controller.js'
import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

router.get(
  '/',
  verifyTokenMiddleware,
  requireRole('admin', 'bodeguero', 'vendedor'),
  dashboardData
)

router.get(
  '/summary',
  verifyTokenMiddleware,
  requireRole('admin', 'bodeguero', 'vendedor'),
  dashboardData
)

export default router
