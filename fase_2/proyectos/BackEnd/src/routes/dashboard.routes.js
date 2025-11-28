import { Router } from 'express'
import { dashboardData, dashboardSummary } from '../controllers/dashboard.controller.js'
import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

router.get(
  '/',
  verifyTokenMiddleware,
  requireRole('admin', 'bodeguero'),
  dashboardData
)

router.get(
  '/summary',
  verifyTokenMiddleware,
  requireRole('admin', 'bodeguero'),
  dashboardSummary
)

export default router
