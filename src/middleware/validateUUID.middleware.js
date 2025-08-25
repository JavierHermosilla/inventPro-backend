import logger from '../utils/logger.js'

/**
 * Middleware para validar que un parámetro URL es un UUID v4 válido
 * @param {string} paramName - Nombre del parámetro en req.params (default 'id')
 */

export const validateUUID = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName]
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  if (!uuidRegex.test(id)) {
    logger.warn(`Invalid UUID format for parameter ${paramName}: ${id}`)
    return res.status(400).json({ message: `Invalid UUID format for parameter ${paramName}` })
  }

  next()
}
