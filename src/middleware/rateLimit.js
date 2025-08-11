import rateLimit from 'express-rate-limit'
import logger from '../utils/logger.js'

// Handler genérico para cuando se exceden los límites
const handleTooManyRequests = (req, res, next, options) => {
  logger.warn(`Rate limit exceeded on ${req.originalUrl} from IP ${req.ip}`)
  res.status(options.statusCode).json(options.message)
}

// Limiter para login: max 5 intentos cada 15 minutos
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  handler: handleTooManyRequests,
  message: {
    message: 'Too many login attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true, // incluye cabeceras RateLimit en respuesta
  legacyHeaders: false // desactiva cabeceras viejas
})

// Limiter para registro: max 10 intentos cada 15 minutos
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 intentos
  handler: handleTooManyRequests,
  message: {
    message: 'Too many registration attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
})
