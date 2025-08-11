export const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',').shift().trim() ||
    req.connection?.remoteAddress ||
    req.ip
}
