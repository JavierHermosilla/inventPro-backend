import xss from 'xss'
import logger from '../utils/logger.js'

/**
 * Función recursiva para sanitizar todas las cadenas dentro de un objeto
 * @param {object} obj
 */
const sanitize = (obj) => {
  if (!obj || typeof obj !== 'object') return
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = xss(obj[key])
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitize(obj[key])
    }
  }
}

/**
 * Middleware para sanitizar las entradas de req.body, req.query y req.params
 */
export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    sanitize(req.body)
    logger.debug('Sanitized req.body:', req.body)
  }

  if (req.query) {
    sanitize(req.query)
    logger.debug('Sanitized req.query:', req.query)
  }

  if (req.params) {
    sanitize(req.params)
    logger.debug('Sanitized req.params:', req.params)
  }

  next()
}
