// src/middleware/sanitizeInput.js
import xss from 'xss'

/**
 * Función recursiva para sanitizar todas las cadenas dentro de un objeto
 * @param {object} obj
 */
const sanitize = (obj) => {
  if (!obj || typeof obj !== 'object') return
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      if (typeof item === 'string') {
        obj[index] = xss(item)
      } else if (typeof item === 'object' && item !== null) {
        sanitize(item)
      }
    })
  } else {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = xss(obj[key])
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key])
      }
    }
  }
}

/**
 * Middleware para sanitizar las entradas de req.body, req.query y req.params
 */
export const sanitizeInput = (req, res, next) => {
  if (req.body) sanitize(req.body)
  if (req.query) sanitize(req.query)
  if (req.params) sanitize(req.params)
  next()
}
