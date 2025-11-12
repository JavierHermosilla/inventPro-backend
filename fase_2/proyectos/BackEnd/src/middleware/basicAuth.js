import { Buffer } from 'node:buffer'

/**
 * Middleware simple de Basic Auth.
 * Si falta usuario o contraseña, se deja pasar para no romper entornos locales.
 */
export const basicAuth = ({
  username,
  password,
  realm = 'Restricted Area'
} = {}) => {
  const enabled = Boolean(username && password)

  return (req, res, next) => {
    if (!enabled) return next()

    const header = req.headers.authorization || ''
    if (!header.startsWith('Basic ')) {
      res.set('WWW-Authenticate', `Basic realm="${realm}", charset="UTF-8"`)
      return res.status(401).send('Authentication required')
    }

    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
    const separatorIndex = decoded.indexOf(':')
    const user = separatorIndex >= 0 ? decoded.slice(0, separatorIndex) : decoded
    const pass = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : ''

    if (user === username && pass === password) {
      return next()
    }

    res.set('WWW-Authenticate', `Basic realm="${realm}", charset="UTF-8"`)
    return res.status(401).send('Authentication required')
  }
}
