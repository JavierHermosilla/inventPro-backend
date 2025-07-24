export const validateSchema = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body)
    next()
  } catch (err) {
    return res.status(400).json({
      massaje: err.errors.map(e => e.massaje)
    })
  }
}
