import { ZodError } from 'zod'
import logger from '../utils/logger.js'

export const validateSchema = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body)
    next()
  } catch (err) {
    if (err instanceof ZodError && Array.isArray(err.errors)) {
      logger.warn(`Schema validation failed for ${req.originalUrl}`, {
        errors: err.errors
      })
      return res.status(400).json({
        errors: err.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      })
    }

    try {
      const parsed = JSON.parse(err.message)
      if (Array.isArray(parsed)) {
        logger.warn(`Schema validation failed (parsed error) for ${req.originalUrl}`, {
          errors: parsed
        })
        return res.status(400).json({
          errors: parsed.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        })
      }
    } catch {

    }
    logger.error(`Unexpected schema validation error for ${req.originalUrl}`, {
      message: err.message,
      stack: err.stack
    })

    return res.status(500).json({
      message: 'Unexpected validation error.',
      detail: err.message
    })
  }
}
