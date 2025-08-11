import logger from '../utils/logger.js'

/**
 * Middleware para validar req.body con un schema Zod
 * @param {ZodSchema} schema - Schema Zod para validar req.body
 */
export const validateSchema = (schema) => (req, res, next) => {
  console.log('=== VALIDATE SCHEMA DEBUG ===')
  console.log('Headers:', req.headers)
  console.log('Body:', req.body)
  console.log('Query:', req.query)
  console.log('Params:', req.params)
  console.log('Schema shape:', schema.shape)

  // Sólo validar si el método puede llevar body
  const methodsWithBody = ['POST', 'PUT', 'PATCH']
  if (!methodsWithBody.includes(req.method)) {
    return next()
  }

  if (!req.body) {
    console.log('No body received, skipping validation')
    return next()
  }

  const result = schema.safeParse(req.body)

  if (!result.success) {
    console.log('Validation error object:', result.error)

    const errors = (result.error?.issues && Array.isArray(result.error.issues))
      ? result.error.issues.map(e => ({
        path: e.path.join('.') || '',
        message: e.message
      }))
      : [{ path: '', message: 'Validation failed with unknown error' }]

    logger.warn(`Schema validation failed for ${req.method} ${req.originalUrl}`, { errors })

    return res.status(400).json({ errors })
  }

  req.body = result.data
  next()
}
