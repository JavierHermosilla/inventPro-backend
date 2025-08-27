import User from '../models/user.model.js'
import { verifyToken } from '../libs/jwt.js'
import logger from '../utils/logger.js'

// Middleware para verificar token y cargar usuario en req.user
export const verifyTokenMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : req.cookies?.token

    if (!token) {
      logger.warn('Authorization denied: no token provided')
      return res.status(401).json({ message: 'No token provided, authorization denied' })
    }

    const decoded = await verifyToken(token)
    if (!decoded?.id) {
      logger.warn('Invalid token payload: missing id')
      return res.status(401).json({ message: 'Invalid token payload' })
    }

    const user = await User.findByPk(decoded.id)
    if (!user) {
      logger.warn(`Authorization denied: user not found for decoded id ${decoded.id}`)
      return res.status(404).json({ message: 'User not found' })
    }

    // Guardar rol en minúsculas para evitar errores de comparación
    req.user = { id: user.id, role: user.role?.toLowerCase() }
    next()
  } catch (err) {
    logger.error(`Token verification failed: ${err.message}`, { stack: err.stack })
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

// Middleware para permitir acceso solo a roles específicos
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized: No user info' })

  const allowedRoles = roles.map(r => r.toLowerCase())
  if (!allowedRoles.includes(req.user.role)) {
    logger.warn(`Forbidden access attempt by user ${req.user.id} with role ${req.user.role}`)
    return res.status(403).json({ message: 'Forbidden: You do not have permission' })
  }

  next()
}

// Middleware para permitir acceso a rol específico o al mismo usuario
export const requireRoleOrSelf = (role) => (req, res, next) => {
  const user = req.user
  const paramId = req.params?.id?.toString()
  if (!user?.id || !user?.role) return res.status(401).json({ message: 'Unauthorized: missing user info' })

  if (user.role === role.toLowerCase() || user.id === paramId) return next()

  return res.status(403).json({ message: 'Access denied: insufficient permissions' })
}
