import rateLimit from 'express-rate-limit'
import logger from '../utils/logger.js'

const handleTooManyRequests = (req, res, next, options) => {
  logger.warn(`Rate limit exceeded on ${req.originalUrl} from IP ${req.ip}`)
  res.status(options.statusCode).json(options.message)
}

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // cada 15 min
  max: 5, // bloqueo al los 5 intentos
  handler: handleTooManyRequests,
  message: {
    message: 'Too many login attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
})

export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler: handleTooManyRequests,
  message: {
    message: 'Too many registration attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
})
