import mongoose from 'mongoose'
import logger from '../utils/logger.js'

/**
 * Middleware para validar que un parámetro URL es un ObjectId válido de MongoDB
 * @param {string} paramName - Nombre del parámetro en req.params (default 'id')
 */
export const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName]

  if (!mongoose.Types.ObjectId.isValid(id)) {
    logger.warn(`Invalid ObjectId detected for param "${paramName}": ${id}`)
    return res.status(400).json({ message: `Invalid ${paramName} parameter` })
  }

  next()
}
