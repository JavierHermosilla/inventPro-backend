// src/middleware/auth.middleware.js
import * as cfg from '../config/config.js'
import User from '../models/user.model.js'
import { verifyAccessToken } from '../libs/jwt.js'
import logger from '../utils/logger.js'

// ---------- helpers ----------
function getBearerToken (req) {
  const auth = req.headers.authorization || ''
  return auth.startsWith('Bearer ') ? auth.slice(7) : null
}

function normRole (r) {
  return typeof r === 'string' ? r.trim().toLowerCase() : ''
}

// ---------- middleware principal: verifica access token ----------
export const verifyTokenMiddleware = async (req, res, next) => {
  try {
    // 1) token por header (preferido)
    const headerToken = getBearerToken(req)

    // 2) token por cookie (opcional, si ALLOW_COOKIE_AUTH=true)
    const cookieToken = cfg.ALLOW_COOKIE_AUTH ? req.cookies?.token : null

    const token = headerToken || cookieToken
    if (!token) {
      logger.warn(`Auth denied: no token (URL=${req.method} ${req.originalUrl})`)
      return res.status(401).json({ message: 'No token provided, authorization denied' })
    }

    // Verifica firma/exp y obtén payload (espera { id, role? })
    const decoded = await verifyAccessToken(token)
    if (!decoded?.id) {
      logger.warn('Invalid token payload: missing id')
      return res.status(401).json({ message: 'Invalid token payload' })
    }

    // Confirma que el usuario existe (respeta paranoid: true)
    const user = await User.findByPk(decoded.id)
    if (!user) {
      logger.warn(`Auth denied: user not found (id=${decoded.id})`)
      return res.status(404).json({ message: 'User not found' })
    }

    req.user = { id: user.id, role: normRole(user.role) }
    return next()
  } catch (err) {
    const code = err?.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID'
    logger.error(`Token verification failed: ${err.message}`, { code })
    return res.status(401).json({ message: 'Invalid or expired token', code })
  }
}

// ---------- requiere uno de los roles ----------
export const requireRole = (...roles) => {
  // normaliza/filtra roles esperados
  const allowed = roles.flat().map(normRole).filter(Boolean)

  return (req, res, next) => {
    if (!req.user?.role) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    if (allowed.length === 0 || allowed.includes(normRole(req.user.role))) {
      return next()
    }
    return res.status(403).json({ message: 'Forbidden' })
  }
}

// ---------- requiere rol o ser el mismo usuario (:id) ----------
export const requireRoleOrSelf = (...roles) => {
  const allowed = roles.flat().map(normRole).filter(Boolean)

  return (req, res, next) => {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const isSelf = req.params?.id && String(req.params.id) === String(req.user.id)
    const isAllowedRole = allowed.length > 0 && allowed.includes(normRole(req.user.role))

    if (isSelf || isAllowedRole) return next()
    return res.status(403).json({ message: 'Forbidden' })
  }
}

/* Opcional: alias de compatibilidad si tu código viejo usa estos nombres */
// export const requireAuth = verifyTokenMiddleware
