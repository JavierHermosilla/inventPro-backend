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
