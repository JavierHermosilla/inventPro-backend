import rateLimit from 'express-rate-limit'

export const loginRateLimiter = rateLimit({
  windows: 15 * 60 * 1000, // cada 15 min
  max: 5, // bloqueo al los 5 intentos
  message: {
    message: 'Too many login attempts. Please try again in 15 minutes.'
  },
  standarHeaders: true,
  legacyHeaders: false
})
