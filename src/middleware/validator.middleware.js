import logger from '../utils/logger.js'

export const validateSchema = (schema) => (req, res, next) => {
  try {
    // Validar solo para métodos que envían body
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return next()

    // Asegurar que req.body sea siempre un objeto
    if (!req.body || typeof req.body !== 'object') {
      req.body = {}
    }

    // 🔹 Depuración temporal antes de Zod
    console.log(`REQ.BODY recibido en ${req.method} ${req.originalUrl}:`, req.body)

    const result = schema.safeParse(req.body)

    if (!result.success) {
      // 🔹 Depuración detallada de errores Zod
      console.log('❌ Zod validation errors detallados:', JSON.stringify(result.error.issues, null, 2))

      const errors = result.error.issues.map(e => ({
        path: e.path.join('.') || '',
        message: e.message
      }))

      logger.warn(`Schema validation failed for ${req.method} ${req.originalUrl}`, { errors })
      return res.status(400).json({ errors })
    }

    // Sobrescribir con datos validados
    req.body = result.data
    next()
  } catch (error) {
    logger.error('Unexpected error in validateSchema middleware', {
      message: error.message,
      stack: error.stack
    })
    res.status(500).json({ message: 'Internal server error' })
  }
}
