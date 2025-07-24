import { Router } from 'express'
import { dashboardData } from '../controllers/dashboard.controller.js'

const router = Router()

router.get('/', dashboardData)

export default router
