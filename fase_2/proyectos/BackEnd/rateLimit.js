// src/middleware/rateLimit.js
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import logger from '../utils/logger.js'

/** Parse helpers */
const toInt = (v, def) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : def
}

/** Handler unificado */
const handleTooManyRequests = (req, res, _next, options) => {
  logger.warn('Rate limit exceeded', {
    url: req.originalUrl,
    ip: req.ip,
    requestId: req.id
  })
  res.status(options.statusCode).json(options.message)
}

/**
 * Factory de limiters.
 * - En test, siempre bypass.
 * - Permite pasar `skip` y `keyGenerator` custom.
 * - Por defecto usa ipKeyGenerator(req) (obligatorio en v7 por IPv6).
 */
const createLimiter = ({ windowMs, max, message, skip, keyGenerator }) => {
  if (process.env.NODE_ENV === 'test') {
    return (_req, _res, next) => next()
  }

  return rateLimit({
    windowMs,
    max,
    handler: handleTooManyRequests,
    message: { message },
    standardHeaders: true,
    legacyHeaders: false,
    skip, // opcional
    // 🔧 CLAVE: usar siempre ipKeyGenerator(req) o un compuesto que lo incluya
    keyGenerator: keyGenerator || ((req) => ipKeyGenerator(req))
  })
}

/** Limiter GLOBAL (todas las rutas, salvo exclusiones) */
export const globalRateLimiter = createLimiter({
  windowMs: toInt(process.env.RATE_GLOBAL_WINDOW_MS, 60_000), // .env → 60000
  max: toInt(process.env.RATE_GLOBAL_MAX, 1000), // .env → 1000
  message: 'Too many requests. Please slow down.',
  // Excluye rutas necesarias para monitoreo/doc
  skip: (req) => {
    const p = req.path || ''
    return (
      req.method === 'OPTIONS' ||
      p.startsWith('/api/health') ||
      p.startsWith('/metrics') ||
      p.startsWith('/docs') || // swagger-ui
      p.startsWith('/api-docs') || // openapi json
      p.startsWith('/swagger') // si usas /swagger
    )
  }
})

/** Limiter para login (ENV configurable) */
export const loginRateLimiter = createLimiter({
  windowMs: toInt(process.env.RATE_LOGIN_WINDOW_MS, 15 * 60 * 1000),
  max: toInt(process.env.RATE_LOGIN_MAX, 5),
  message: 'Too many login attempts. Please try again in 15 minutes.'
})

/** Limiter para registro */
export const registerLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many registration attempts. Please try again in 15 minutes.'
})
