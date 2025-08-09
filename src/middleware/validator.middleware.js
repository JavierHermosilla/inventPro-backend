import { ZodError } from 'zod'
import logger from '../utils/logger.js'

export const validateSchema = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params
  })

  if (!result.success) {
    const errors = result.error.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message
    }))

    logger.warn(`Schema validation failed for ${req.method} ${req.originalUrl}`, { errors })

    return res.status(400).json({ errors })
  }

  req.body = result.data.body || req.body
  req.query = result.data.query || req.query
  req.params = result.data.params || req.params

  next()
}
