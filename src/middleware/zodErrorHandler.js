export function zodErrorHandler (err, req, res, next) {
  if (err.name === 'ZodError') {
    const formatted = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }))

    return res.status(400).json({
      message: 'Validation failed',
      errors: formatted
    })
  }

  next(err)
}
