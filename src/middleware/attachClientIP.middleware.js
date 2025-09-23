import { getClientIP } from '../utils/ip.js'

export const attachClientIP = (req, res, next) => {
  req.clientIP = getClientIP(req)
  next()
}
