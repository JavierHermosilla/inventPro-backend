// src/controllers/auth.controller.js
import pick from 'lodash/pick.js'
import bcrypt from 'bcryptjs'
import { ZodError } from 'zod'

import User from '../models/user.model.js'
import logger from '../utils/logger.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../libs/jwt.js'
import * as cfg from '../config/config.js'

// ───────────────────────────────────────────────────────────────────────────────
// Config cookie del refresh (de sesión → sin maxAge/expires)
// ───────────────────────────────────────────────────────────────────────────────
const refreshCookieOpts = {
  httpOnly: true,
  secure: cfg.COOKIE_SECURE, // true en prod con HTTPS
  sameSite: 'lax',
  path: '/api/auth/refresh'
}

const PUBLIC_USER_FIELDS = [
  'id', 'username', 'name', 'email', 'role', 'phone', 'address', 'avatar', 'createdAt', 'updatedAt'
]

const ALLOWED_ROLES_ON_REGISTER = ['user', 'vendedor']

const normEmail = (s) => String(s ?? '').trim().toLowerCase()

// ───────────────────────────────────────────────────────────────────────────────
// Registro
// ───────────────────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  const userIP = req.clientIP || req.ip || 'unknown'
  try {
    const { username, name, email, password, phone, address, avatar, role } = req.body

    const emailNorm = normEmail(email)
    const safeRole = ALLOWED_ROLES_ON_REGISTER.includes(String(role).toLowerCase())
      ? String(role).toLowerCase()
      : 'user'

    // Unicidad por email
    const existing = await User.findOne({ where: { email: emailNorm } })
    if (existing) {
      logger.warn(`Register denied (duplicate email): ${emailNorm}, IP=${userIP}`)
      return res.status(400).json({ errors: [{ path: 'email', message: 'El correo ya está en uso.' }] })
    }

    const userSaved = await User.create({
      username, name, email: emailNorm, password, phone, address, avatar, role: safeRole
    })

    // Tokens
    const access = await signAccessToken({ id: userSaved.id, role: userSaved.role })
    const refresh = await signRefreshToken({ id: userSaved.id, role: userSaved.role })

    // Cookie de sesión con refresh
    res.cookie('refresh_token', refresh, refreshCookieOpts)

    logger.info(`User registered: ${emailNorm}, id=${userSaved.id}, IP=${userIP}`)

    return res.status(201).json({
      token: access,
      ...pick(userSaved, PUBLIC_USER_FIELDS)
    })
  } catch (err) {
    logger.error(`Registration error: ${err.message}, IP=${userIP}`, { stack: err.stack })
    if (err instanceof ZodError) {
      const errors = err.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
      return res.status(400).json({ errors })
    }
    return res.status(500).json({ message: 'Error interno al registrar usuario' })
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Login
// ───────────────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  const userIP = req.clientIP || req.ip || 'unknown'
  try {
    const { email, password } = req.body
    const emailNorm = normEmail(email)

    const user = await User.scope('withPassword').findOne({ where: { email: emailNorm } })
    if (!user) {
      logger.warn(`Login failed: email not found (${emailNorm}), IP=${userIP}`)
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' })
    }

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      logger.warn(`Login failed: wrong password (${emailNorm}), IP=${userIP}`)
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' })
    }

    const access = await signAccessToken({ id: user.id, role: user.role })
    const refresh = await signRefreshToken({ id: user.id, role: user.role })

    // Cookie de sesión con refresh
    res.cookie('refresh_token', refresh, refreshCookieOpts)

    logger.info(`Login OK: ${emailNorm}, id=${user.id}, IP=${userIP}`)

    return res.status(200).json({
      token: access,
      ...pick(user, PUBLIC_USER_FIELDS)
    })
  } catch (err) {
    logger.error(`Login error: ${err.message}, IP=${userIP}`)
    return res.status(500).json({ message: 'Error interno al iniciar sesión' })
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Refresh (silencioso)
// ───────────────────────────────────────────────────────────────────────────────
export const refresh = async (req, res) => {
  try {
    const rt = req.cookies?.refresh_token
    if (!rt) return res.status(401).json({ message: 'No refresh token' })

    const decoded = await verifyRefreshToken(rt) // { id, role, iat, exp, jti? }

    const access = await signAccessToken({ id: decoded.id, role: decoded.role })

    // (Opcional) Rotación de refresh para mayor seguridad:
    // const newRt = await signRefreshToken({ id: decoded.id, role: decoded.role })
    // res.cookie('refresh_token', newRt, refreshCookieOpts)
    // Revocar jti anterior en whitelist si la usas

    return res.json({ token: access })
  } catch {
    return res.status(401).json({ message: 'Invalid or expired refresh token' })
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Perfil del usuario autenticado
// ───────────────────────────────────────────────────────────────────────────────
export const profile = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' })
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } })
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })
    return res.json(user)
  } catch (err) {
    return res.status(500).json({ message: 'Error interno al obtener perfil' })
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Logout (limpia cookie y corta sesión)
// ───────────────────────────────────────────────────────────────────────────────
export const logout = async (req, res) => {
  const userIP = req.clientIP || req.ip || 'unknown'
  // Si usas whitelist/rotación con jti, revoca aquí el rt
  res.clearCookie('refresh_token', { path: '/api/auth/refresh' })
  logger.info(`Logout OK, IP=${userIP}`)
  return res.status(200).json({ message: 'Sesión cerrada exitosamente.' })
}
