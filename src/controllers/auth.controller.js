import User from '../models/user.model.js'
import logger from '../utils/logger.js'
import pick from 'lodash/pick.js'
import { createAccessToken } from '../libs/jwt.js'
import { ZodError } from 'zod'

// Registro de usuario
export const register = async (req, res) => {
  try {
    const { username, name, email, password, phone, address, avatar, role } = req.body
    const userIP = req.clientIP

    // Solo roles permitidos
    const allowedRoles = ['user', 'manager']
    const safeRole = allowedRoles.includes(role) ? role : 'user'

    // Verificar si ya existe el email
    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      logger.warn(`Duplicate email registration: ${email}, IP: ${userIP}`)
      return res.status(400).json({ errors: [{ path: 'email', message: 'El correo ya está en uso.' }] })
    }

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

    const token = await createAccessToken({ id: userSaved.id })

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })

    logger.info(`User registered successfully: ${email}, IP: ${userIP}`)

    res.status(201).json(pick(userSaved, [
      'id', 'username', 'name', 'email', 'role', 'phone', 'address', 'avatar', 'createdAt', 'updatedAt'
    ]))
  } catch (err) {
    const userIP = req.clientIP
    logger.error(`Registration error: ${err.message}, IP: ${userIP}`, { stack: err.stack })

    if (err instanceof ZodError) {
      const errors = err.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
      return res.status(400).json({ errors })
    }

    return res.status(500).json({ message: err.message })
  }
}

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const userIP = req.clientIP

    const userFound = await User.findOne({ where: { email } })
    if (!userFound) {
      logger.warn(`Login failed, email not found: ${email}, IP: ${userIP}`)
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' })
    }

    const isMatch = await userFound.comparePassword(password)
    if (!isMatch) {
      logger.warn(`Login failed, wrong password: ${email}, IP: ${userIP}`)
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' })
    }

    const token = await createAccessToken({ id: userFound.id })
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })

    logger.info(`Login successful: ${email}, IP: ${userIP}`)

    res.status(200).json({
      token,
      ...pick(userFound, [
        'id', 'username', 'name', 'email', 'role', 'phone', 'address', 'avatar', 'createdAt', 'updatedAt'
      ])
    })
  } catch (err) {
    const userIP = req.clientIP
    logger.error(`Login error: ${err.message}, IP: ${userIP}`)
    return res.status(500).json({ message: err.message })
  }
}

// Perfil del usuario
export const profile = async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' })

    const user = await User.findByPk(req.userId, { attributes: { exclude: ['password'] } })
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })

    res.json(user)
  } catch (err) {
    logger.error(`Profile error: ${err.message}, userId: ${req.userId}`)
    res.status(500).json({ message: err.message })
  }
}

// Logout
export const logout = (req, res) => {
  const userIP = req.clientIP
  res.cookie('token', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict', expires: new Date(0) })
  logger.info(`Logout, IP: ${userIP}`)
  res.status(200).json({ message: 'Sesión cerrada exitosamente.' })
}
