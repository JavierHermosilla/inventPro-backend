import User from '../models/user.model.js'
import { verifyToken } from '../libs/jwt.js'
import { ROLES } from '../config/roles.js'
import logger from '../utils/logger.js'

// middleware para verificar token y cargar usuario en la req
export const verifyTokenMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : req.cookies.token

    if (!token) {
      logger.warn('Authorization denied: no token provided')
      return res.status(401).json({ message: 'no token, authorization denied' })
    }

    const decoded = await verifyToken(token)
    const user = await User.findById(decoded.id)

    if (!user) {
      logger.warn(`Authorization denied: user not found for decoded id ${decoded.id}`)
      return res.status(404).json({ message: ' User not found' })
    }

    req.user = {
      id: user._id.toString(),
      role: user.role
    }
    req.userId = req.user.id

    next()
  } catch (err) {
    logger.error(`Token verification failed: ${err.message}`, { stack: err.stack })
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}
// middleware para permitir acceso solo si tiene rol
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by user ${req.user?.id || 'unknown'} with role ${req.user?.role || 'none'}`)
      return res.status(401).json({ message: 'Unauthorized: Access denied' })
    }
    next()
  }
}
// middleware para permitir accso si es admin o user
export const requireRoleOrSelf = (role) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role || !req.user.id) {
      logger.warn('Unauthorized access attempt: missing user info')
      return res.status(401).json({ message: 'Unauthorized: missing user info' })
    }

    const userId = req.user.id
    const paramId = req.params?.id?.toString()

    if (req.user.role === role || userId === paramId) {
      return next()
    }
    logger.warn(`Access denied for user ${req.user.id} with role ${req.user.role} to resource of user ${paramId}`)
    return res.status(403).json({ message: 'Access denied: insufficient permissions' })
  }
}
