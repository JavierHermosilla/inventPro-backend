// utils/logger.js (reemplazo sugerido)
import { createLogger, format, transports } from 'winston'

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json() // <-- JSON estructurado
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
})

// Helper para adjuntar contexto por request
export const withReq = (req) => {
  const base = { requestId: req?.id, clientIP: req?.clientIP }
  return {
    info: (message, meta = {}) => logger.info(message, { ...base, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { ...base, ...meta }),
    error: (message, meta = {}) => logger.error(message, { ...base, ...meta })
  }
}

export default logger
