import logger from '../utils/logger.js'

/**
 * Middleware genérico:
 *   validate({ body?, params?, query? })
 * Cada key es un schema de Zod. Solo valida lo que pases.
 */
export const validate = (schemas = {}) => (req, res, next) => {
  try {
    const methodAllowsBody = ['POST', 'PUT', 'PATCH'].includes(req.method)
    const ct = (req.headers['content-type'] || '').toLowerCase()

    // BODY
    if (schemas.body && methodAllowsBody) {
      const isJson = ct.includes('application/json')
      if (!isJson) {
        return res.status(415).json({ message: 'Content-Type must be application/json' })
      }
      if (!req.body || typeof req.body !== 'object') req.body = {}
      const r = schemas.body.safeParse(req.body)
      if (!r.success) return respondZod(res, r.error.issues)
      req.body = r.data
    }

    // PARAMS
    if (schemas.params) {
      const r = schemas.params.safeParse(req.params)
      if (!r.success) return respondZod(res, r.error.issues)
      req.params = r.data
    }

    // QUERY
    if (schemas.query) {
      const r = schemas.query.safeParse(req.query)
      if (!r.success) return respondZod(res, r.error.issues)
      req.query = r.data
    }

    next()
  } catch (error) {
    logger.error('Unexpected error in validate middleware', { message: error.message, stack: error.stack })
    res.status(500).json({ message: 'Internal server error' })
  }
}

/**
 * Compat: validateSchema(bodySchema) ⇒ valida solo el body.
 * Así no rompes imports antiguos.
 */
export const validateSchema = (schema) => validate({ body: schema })

function respondZod (res, issues) {
  const errors = issues.map(e => ({ path: e.path.join('.'), message: e.message }))
  return res.status(400).json({ message: 'Validation error', errors })
}
