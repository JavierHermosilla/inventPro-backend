import mongoose from 'mongoose'
import logger from '../utils/logger.js'

export const validateObjectId = (paramName = 'id') => (req, res, next) => {
  const id = req.params[paramName]

  if (!mongoose.Types.ObjectId.isValid(id)) {
    logger.warn(`Invalid ObjectId detected for param "${paramName}": ${id}`)
    return res.status(400).json({ message: `Invalid ${paramName}` })
  }

  next()
}
