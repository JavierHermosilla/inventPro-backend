import logger from '../utils/logger.js'

export function zodErrorHandler (err, req, res, next) {
  if (err?.name === 'ZodError' && Array.isArray(err.errors)) {
    const formatted = err.errors.map(e => ({
      field: e.path.join('.') || '',
      message: e.message
    }))

    logger.warn(`Zod validation failed for ${req.method} ${req.originalUrl}`, {
      errors: formatted,
      ip: req.ip
    })

    return res.status(400).json({
      message: 'Validation failed',
      errors: formatted
    })
  }

  // Pasar a siguiente middleware de error si no es ZodError
  next(err)
}
