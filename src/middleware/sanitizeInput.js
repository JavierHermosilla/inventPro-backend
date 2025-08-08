import xss from 'xss'
import logger from '../utils/logger.js'

const sanitize = (obj) => {
  if (!obj || typeof obj !== 'object') return
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = xss(obj[key])
    } else if (typeof obj[key] === 'object') {
      sanitize(obj[key])
    }
  }
}

export const sanitizeInput = (req, res, next) => {
  sanitize(req.body)
  logger.debug('Sanitized req.body:', req.body)

  sanitize(req.query)
  logger.debug('Sanitized req.query:', req.query)

  sanitize(req.params)
  logger.debug('Sanitized req.params:', req.params)

  next()
}
