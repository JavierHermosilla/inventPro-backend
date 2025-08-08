import logger from '../utils/logger.js'

export const checkRole = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        logger.warn('Unauthorized access attempt: user not found in request')
        return res.status(401).json({ message: 'Unauthorized: user not found in request' })
      }

      if (!Array.isArray(allowedRoles)) {
        logger.error('checkRole middleware misconfiguration: allowedRoles should be an array')
        return res.status(500).json({ message: 'Server configuration error' })
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(`Access denied: user ${req.user.id} with role ${req.user.role} tried to access restricted resource`)
        return res.status(403).json({ message: 'Access denied: insufficient permissions' })
      }

      next()
    } catch (err) {
      logger.error('Error in checkRole middleware', { message: err.message, stack: err.stack })
      return res.status(500).json({ message: err.message })
    }
  }
}
