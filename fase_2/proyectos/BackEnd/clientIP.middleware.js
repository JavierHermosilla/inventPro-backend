// src/middleware/clientIP.middleware.js
export const setClientIP = (req, res, next) => {
  // req.ip es estándar de Express
  req.clientIP = req.headers['x-forwarded-for'] || req.ip
  next()
}
