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
