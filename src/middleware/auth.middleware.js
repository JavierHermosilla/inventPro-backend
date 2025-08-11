import User from '../models/user.model.js'
import { verifyToken } from '../libs/jwt.js'
import logger from '../utils/logger.js'

// Middleware para verificar token y cargar usuario en req.user
export const verifyTokenMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : req.cookies.token

    if (!token) {
      logger.warn('Authorization denied: no token provided')
      return res.status(401).json({ message: 'No token provided, authorization denied' })
    }

    const decoded = await verifyToken(token)

    if (!decoded?.id) {
      logger.warn('Invalid token payload: missing id')
      return res.status(401).json({ message: 'Invalid token payload' })
    }

    const user = await User.findById(decoded.id)
    if (!user) {
      logger.warn(`Authorization denied: user not found for decoded id ${decoded.id}`)
      return res.status(404).json({ message: 'User not found' })
    }

    req.user = { id: user._id.toString(), role: user.role }
    req.userId = req.user.id

    next()
  } catch (err) {
    logger.error(`Token verification failed: ${err.message}`, { stack: err.stack })
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

// Middleware para permitir acceso solo si el usuario tiene alguno de los roles permitidos
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized: No user info' })
  }
  if (!roles.includes(req.user.role)) {
    logger.warn(`Forbidden access attempt by user ${req.user.id} with role ${req.user.role}`)
    return res.status(403).json({ message: 'Forbidden: You do not have permission' })
  }
  next()
}

// Middleware para permitir acceso si es rol indicado o el mismo usuario (por id)
export const requireRoleOrSelf = (role) => (req, res, next) => {
  if (!req.user || !req.user.role || !req.user.id) {
    logger.warn('Unauthorized access attempt: missing user info')
    return res.status(401).json({ message: 'Unauthorized: missing user info' })
  }

  const userId = req.user.id
  const paramId = req.params?.id?.toString()

  if (req.user.role === role || userId === paramId) {
    return next()
  }
  logger.warn(`Access denied for user ${userId} with role ${req.user.role} to resource of user ${paramId}`)
  return res.status(403).json({ message: 'Access denied: insufficient permissions' })
}
