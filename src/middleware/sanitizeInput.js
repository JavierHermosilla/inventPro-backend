import xss from 'xss'

export const sanitizeInput = (req, res, next) => {
  console.log('Antes de sanitizeInput:', req.body)
  const sanitize = obj => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = xss(obj[key])
      }
    }
  }

  sanitize(req.body)
  console.log('Después de sanitizeInput:', req.body)
  sanitize(req.query)
  sanitize(req.params)
  next()
}
