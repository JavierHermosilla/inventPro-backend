import pick from 'lodash/pick.js'
import bcrypt from 'bcryptjs'
import User from '../models/user.model.js'
import { createAccessToken } from '../libs/jwt.js'
import logger from '../utils/logger.js'
import { ZodError } from 'zod'

// ==========================
// Registro de usuario
// ==========================
export const register = async (req, res) => {
  try {
    const { username, name, email, password, phone, address, avatar, role } = req.body
    const userIP = req.clientIP || req.ip || 'unknown'

    // Roles permitidos
    const allowedRoles = ['user', 'manager']
    const safeRole = allowedRoles.includes(role) ? role : 'user'

    // Verificar si email ya existe
    const existingUser = await User.findOne({ where: { email: email.trim().toLowerCase() } })
    if (existingUser) {
      logger.warn(`Duplicate email registration: ${email}, IP: ${userIP}`)
      return res.status(400).json({ errors: [{ path: 'email', message: 'El correo ya está en uso.' }] })
    }

    // Crear usuario
    const userSaved = await User.create({
      username,
      name,
      email,
      password,
      phone,
      address,
      avatar,
      role: safeRole
    })

    // Generar JWT
    const token = await createAccessToken({ id: userSaved.id })

    // Guardar cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })

    logger.info(`User registered successfully: ${email}, IP: ${userIP}`)

    return res.status(201).json(
      pick(userSaved, [
        'id', 'username', 'name', 'email', 'role', 'phone', 'address', 'avatar', 'createdAt', 'updatedAt'
      ])
    )
  } catch (err) {
    const userIP = req.clientIP || req.ip || 'unknown'
    logger.error(`Registration error: ${err.message}, IP: ${userIP}`, { stack: err.stack })

    if (err instanceof ZodError) {
      const errors = err.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
      return res.status(400).json({ errors })
    }

    return res.status(500).json({ message: err.message })
  }
}

// ==========================
// Login
// ==========================
export const login = async (req, res) => {
  const userIP = req.clientIP || req.ip || 'unknown'

  try {
    const { email, password } = req.body

    // 🔹 Traer el usuario incluyendo la contraseña
    const userFound = await User.scope('withPassword').findOne({ where: { email: email.trim().toLowerCase() } })

    if (!userFound) {
      logger.warn(`Login failed, email not found: ${email}, IP: ${userIP}`)
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' })
    }

    // 🔹 Verificar contraseña
    const isMatch = await bcrypt.compare(password, userFound.password)
    if (!isMatch) {
      logger.warn(`Login failed, wrong password: ${email}, IP: ${userIP}`)
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' })
    }

    // 🔹 Crear token JWT
    const token = await createAccessToken({ id: userFound.id })

    // 🔹 Enviar cookie segura
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })

    logger.info(`Login successful: ${email}, IP: ${userIP}`)

    // 🔹 Retornar datos del usuario sin la contraseña
    return res.status(200).json({
      token,
      ...pick(userFound, [
        'id', 'username', 'name', 'email', 'role', 'phone', 'address', 'avatar', 'createdAt', 'updatedAt'
      ])
    })
  } catch (err) {
    logger.error(`Login error: ${err.message}, IP: ${userIP}`)
    return res.status(500).json({ message: err.message })
  }
}

// ==========================
// Perfil del usuario
// ==========================
export const profile = async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' })

    const user = await User.findByPk(req.userId, { attributes: { exclude: ['password'] } })
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })

    return res.json(user)
  } catch (err) {
    logger.error(`Profile error: ${err.message}, userId: ${req.userId}`)
    return res.status(500).json({ message: err.message })
  }
}

// ==========================
// Logout
// ==========================
export const logout = (req, res) => {
  const userIP = req.clientIP || req.ip || 'unknown'
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    expires: new Date(0)
  })
  logger.info(`Logout, IP: ${userIP}`)
  return res.status(200).json({ message: 'Sesión cerrada exitosamente.' })
}
