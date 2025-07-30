import xss from 'xss'

export const sanitizeInput = (req, res, next) => {
  const sanitize = obj => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = xss(obj[key])
      }
    }
  }

  sanitize(req.body)
  sanitize(req.query)
  sanitize(req.params)
  next()
}
