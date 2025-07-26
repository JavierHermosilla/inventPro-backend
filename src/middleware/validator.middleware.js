import { ZodError } from 'zod'

export const validateSchema = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body)
    next()
  } catch (err) {
    console.log('error: ', err)

    if (err instanceof ZodError) {
      return res.status(400).json({
        message: err.errors?.map(e => e.message)
      })
    }

    return res.status(500).json({
      messaje: 'Error de validacion inesperada',
      detail: err.message
    })
  }
}
