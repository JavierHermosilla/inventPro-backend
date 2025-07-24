import jwt from 'jsonwebtoken'
import { TOKEN_SECRET } from '../config/config.js'

export const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies.token

    if (!token) {
      return res.status(401).json({ message: 'no token, authorization denied' })
    }

    // verificacion del token
    jwt.verify(token, TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Token is not valid ' })
      }

      // guardamos la info del user decodificada en req
      req.userId = decoded.id
      next()
    })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}
