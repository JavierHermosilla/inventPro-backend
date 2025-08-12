import logger from '../utils/logger.js'

export const validateSchema = (schema) => (req, res, next) => {
  try {
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return next()

    if (!req.body) return next()

    const result = schema.safeParse(req.body)

    if (!result.success) {
      console.log('Zod validation errors:', result.error.issues)
      const errors = result.error.issues.map(e => ({
        path: e.path.join('.') || '',
        message: e.message
      }))

      logger.warn(`Schema validation failed for ${req.method} ${req.originalUrl}`, { errors })

      return res.status(400).json({ errors })
    }

    req.body = result.data
    next()
  } catch (error) {
    logger.error('Unexpected error in validateSchema middleware', { message: error.message, stack: error.stack })
    res.status(500).json({ message: 'Internal server error' })
  }
}
