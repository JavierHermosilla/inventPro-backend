// src/libs/jwt.js
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'

// Access token corto
export function signAccessToken (payload) {
  const secret = process.env.JWT_SECRET
  const expiresIn = process.env.JWT_EXPIRES_IN || '15m'
  if (!secret) throw new Error('JWT_SECRET not defined')
  return jwt.sign(payload, secret, { expiresIn })
}

// Refresh token largo
export function signRefreshToken (payload) {
  const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
  if (!secret) throw new Error('REFRESH_TOKEN_SECRET not defined')
  return jwt.sign({ ...payload, jti: randomUUID() }, secret, { expiresIn })
}

export function verifyAccessToken (token) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET not defined')
  return jwt.verify(token, secret)
}

export function verifyRefreshToken (token) {
  const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET
  if (!secret) throw new Error('REFRESH_TOKEN_SECRET not defined')
  return jwt.verify(token, secret)
}

// ── ALIAS de compatibilidad ──────────────────────────────
export const createAccessToken = signAccessToken
export const verifyToken = verifyAccessToken
