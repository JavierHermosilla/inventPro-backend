import { Router } from 'express'
import { login, register, logout, profile } from '../controllers/auth.controller.js'
import { validateSchema } from '../middleware/validator.middleware.js'
import { registerSchema, loginSchema } from '../schemas/auth.schema.js'
import { verifyToken } from '../middleware/auth.middleware.js'
import { loginRateLimiter } from '../middleware/rateLimit.js'

const router = Router()
// autentificacion
router.post('/register', validateSchema(registerSchema), register)
router.post('/login', loginRateLimiter, validateSchema(loginSchema), login)
router.post('/logout', logout) // con front end hecho
router.get('/profile', verifyToken, profile) // con front en hecho

export default router
