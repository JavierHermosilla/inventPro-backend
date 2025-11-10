// src/utils/ip.js
export const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',').shift().trim() ||
    req.headers['x-real-ip']?.trim() ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    req.ip
}
