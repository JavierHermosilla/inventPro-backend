// src/config/config.js
import 'dotenv/config'

// Entorno / server
export const NODE_ENV = process.env.NODE_ENV ?? 'development'
export const HOST = process.env.HOST ?? '127.0.0.1'
export const PORT = Number(process.env.PORT ?? 3000)

// JWT (access)
export const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_dev'
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'

// Refresh token
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'change_me_refresh_in_dev'
export const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'

// Cookies / CORS
export const COOKIE_SECURE = String(process.env.COOKIE_SECURE).toLowerCase() === 'true'
export const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || ''
export const ALLOW_COOKIE_AUTH = String(process.env.ALLOW_COOKIE_AUTH).toLowerCase() === 'true'
export const CORS_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

// DB (app puede usarlas también)
export const DB_NAME = process.env.DB_NAME
export const DB_USER = process.env.DB_USER
export const DB_PASSWORD = process.env.DB_PASSWORD
export const DB_HOST = process.env.DB_HOST
export const DB_PORT = Number(process.env.DB_PORT ?? 5432)
export const DB_SCHEMA = process.env.DB_SCHEMA || 'inventpro_user'
