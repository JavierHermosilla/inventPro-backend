import { ZodError } from 'zod'

export const validateSchema = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body)
    next()
  } catch (err) {
    if (err instanceof ZodError && Array.isArray(err.errors)) {
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
        return res.status(400).json({
          errors: parsed.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        })
      }
    } catch {

    }
    return res.status(500).json({
      message: 'Unexpected validation error.',
      detail: err.message
    })
  }
}
