import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'
import { TOKEN_SECRET } from '../config/config.js'

// middleware para verificar token y cargar usuario en la req
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : req.cookies.token

    if (!token) {
      return res.status(401).json({ message: 'no token, authorization denied' })
    }

    const decoded = jwt.verify(token, TOKEN_SECRET)
    // let decoded
    // try {
    //   decoded = jwt.verify(token, TOKEN_SECRET)
    // } catch (verifyError) {
    //   console.log('JWT verify error:', verifyError)
    //   return res.status(401).json({ message: 'Invalid or expired token' })
    // }
    const user = await User.findById(decoded.id)

    if (!user) return res.status(404).json({ message: ' User not found' })

    req.user = {
      id: user._id.toString(),
      role: user.role
    }
    req.userId = user._id.toString()

    next()
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}
// middleware para permitir acceso solo si tiene rol
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Unauthorized: missing role' })
    }

    if (req.user.role !== role) {
      return res.status(403).json({ message: 'Access denied: admin only' })
    }

    next()
  }
}

// middleware para permitir accso si es admin o user
export const requireRoleOrSelf = (role) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: missing user info' })
    }

    const userId = req.user.id
    const paramId = req.params?.id?.toString()

    if (req.user.role === role || userId === paramId) {
      return next()
    }
    return res.status(403).json({ message: 'Access denied: insufficient permissions' })
  }
}
