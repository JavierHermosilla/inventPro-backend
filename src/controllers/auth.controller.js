import bcrypt from 'bcryptjs'
import User from '../models/user.model.js'
import { createAccessToken } from '../libs/jwt.js'
import { registerSchema, loginSchema } from '../schemas/auth.schema.js'
import { ZodError } from 'zod'
import logger from '../utils/logger.js'

export const register = async (req, res) => {
  try {
    // validacion de zod
    registerSchema.parse(req.body)

    const { username, name, email, password, phone, address, avatar, role } = req.body
    const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress

    // restriccion de creacion de rol admin
    const allowedRoles = ['user', 'manager']
    const safeRole = allowedRoles.includes(role) ? role : 'user'

    // verificacion si existe un user con el email
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      logger.warn(`Registration attempt with duplicate email: ${email} from ip ${userIP}`)
      return res.status(400).json({ message: 'The email is already in use.' })
    }

    // hash de contraseña
    const passwordhash = await bcrypt.hash(password, 10)

    const newUser = new User({
      username,
      name,
      email,
      password: passwordhash,
      phone,
      address,
      avatar,
      role: safeRole
    })

    const userSaved = await newUser.save()
    const token = await createAccessToken({ id: userSaved._id })

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })

    logger.info(`User registered successfully: ${email} from IP ${userIP}`)

    res.status(201).json({
      id: userSaved._id,
      username: userSaved.username,
      name: userSaved.name,
      email: userSaved.email,
      role: userSaved.role,
      phone: userSaved.phone,
      address: userSaved.address,
      avatar: userSaved.avatar,
      createdAt: userSaved.createdAt,
      updatedAt: userSaved.updatedAt
    })
  } catch (err) {
    const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    logger.error(`Registration error from IP ${userIP}: ${err.message} `)

    if (err instanceof ZodError) {
      return res.status(400).json({ message: err.errors.map(e => e.message) })
    }

    return res.status(500).json({ message: err.message })
  }
}
export const login = async (req, res) => {
  try {
    loginSchema.parse(req.body)

    const { email, password } = req.body
    const userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress

    const userFound = await User.findOne({ email })

    if (!userFound) {
      logger.warn(`Login attempt with invalid email: ${email} from IP ${userIP}`)
      return res.status(400).json({ message: 'Username or password is incorrect.' })
    }

    // hash de contraseña
    const isMatch = await bcrypt.compare(password, userFound.password)

    if (!isMatch) {
      logger.warn(`Incorrect password for: ${email} from IP ${userIP}`)
      return res.status(400).json({ message: 'Username or password is incorrect.' })
    }

    const token = await createAccessToken({ id: userFound._id })

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })

    res.status(200).json({
      token,
      id: userFound._id,
      username: userFound.username,
      name: userFound.name,
      email: userFound.email,
      role: userFound.role,
      phone: userFound.phone,
      address: userFound.address,
      avatar: userFound.avatar,
      createdAt: userFound.createdAt,
      updatedAt: userFound.updatedAt
    })
  } catch (err) {
    logger.error(`Login error: ${err.message}`)
    if (err instanceof ZodError) {
      return res.status(400).json({ message: err.errors.map(e => e.message) })
    }
    return res.status(500).json({ message: err.message })
  }
}
export const profile = async (req, res) => {
  try {
    // verificacion si se seteo el userId
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const user = await User.findById(req.userId).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'user not found' })
    }

    res.json(user)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}
export const logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    expires: new Date(0)
  })

  return res.status(200).json({ message: 'sesión cerrada correctamente' })
}
