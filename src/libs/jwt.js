// src/libs/jwt.js
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import * as cfg from '../config/config.js'

// Access token corto
export function signAccessToken (payload) {
  const token = jwt.sign(payload, cfg.JWT_SECRET, { expiresIn: cfg.JWT_EXPIRES_IN || '15m' })
  return Promise.resolve(token)
}

// Refresh token (larga vida). Incluye jti por si luego usas whitelist/rotación.
export function signRefreshToken (payload) {
  const token = jwt.sign(
    { ...payload, jti: randomUUID() },
    cfg.REFRESH_TOKEN_SECRET,
    { expiresIn: cfg.REFRESH_TOKEN_EXPIRES_IN || '7d' }
  )
  return Promise.resolve(token)
}

export function verifyAccessToken (token) {
  try { return Promise.resolve(jwt.verify(token, cfg.JWT_SECRET)) } catch (err) { return Promise.reject(err) }
}

export function verifyRefreshToken (token) {
  try { return Promise.resolve(jwt.verify(token, cfg.REFRESH_TOKEN_SECRET)) } catch (err) { return Promise.reject(err) }
}

/* ── ALIAS de compatibilidad ──────────────────────────────────────────────
   Para que el código viejo que importaba estos nombres no rompa.
   Puedes borrar estos alias cuando termines de migrar todo. */
export const createAccessToken = signAccessToken
export const verifyToken = verifyAccessToken
