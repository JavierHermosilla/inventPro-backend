import bcrypt from 'bcryptjs'
import User from '../models/user.model.js'
import logger from '../utils/logger.js'
import pick from 'lodash/pick.js'
import { createAccessToken } from '../libs/jwt.js'
import { registerSchema, loginSchema } from '../schemas/auth.schema.js'
import { ZodError } from 'zod'

export const register = async (req, res) => {
  try {
    // validacion de zod
    registerSchema.parse(req.body)

    const { username, name, email, password, phone, address, avatar, role } = req.body
    const userIP = req.headers['x-forwarded-for']?.split(',').shift().trim() || req.connection.remoteAddress || req.ip

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
      ...pick(userSaved, [
        '_id',
        'username',
        'name',
        'email',
        'role',
        'phone',
        'address',
        'avatar',
        'createdAt',
        'updatedAt'

      ])
    })
  } catch (err) {
    const userIP = req.headers['x-forwarded-for']?.split(',').shift().trim() || req.connection.remoteAddress || req.ip
    logger.error(`Registration error from IP ${userIP}: ${err.message} `)

    if (err instanceof ZodError) {
      logger.warn(`Validation error during register/login from IP ${userIP}: ${err.errors.map(e => e.message).join('; ')}`)
      return res.status(400).json({ message: err.errors.map(e => e.message) })
    }

    return res.status(500).json({ message: err.message })
  }
}
export const login = async (req, res) => {
  try {
    loginSchema.parse(req.body)

    const { email, password } = req.body
    const userIP = req.headers['x-forwarded-for']?.split(',').shift().trim() || req.connection.remoteAddress || req.ip

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

    logger.info(`Successful login for: ${email} from IP: ${userIP}`)

    const token = await createAccessToken({ id: userFound._id })

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })

    res.status(200).json({
      token,
      ...pick(userFound, [
        '_id',
        'username',
        'name',
        'email',
        'role',
        'phone',
        'address',
        'avatar',
        'createdAt',
        'updatedAt'
      ])
    })
  } catch (err) {
    const userIP = req.headers['x-forwarded-for']?.split(',').shift().trim() || req.connection.remoteAddress || req.ip
    logger.error(`Login error from IP ${userIP}: ${err.message}`)
    if (err instanceof ZodError) {
      logger.warn(`Validation error during register/login from IP ${userIP}: ${err.errors.map(e => e.message).join('; ')}`)
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
    logger.error(`Profile fetch error for userId ${req.userId}: ${err.message}`)
    return res.status(500).json({ message: err.message })
  }
}
export const logout = (req, res) => {
  const userIP = req.headers['x-forwarded-for']?.split(',').shift().trim() || req.connection.remoteAddress || req.ip
  logger.info(`Logout from IP: ${userIP}`)
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    expires: new Date(0)
  })

  return res.status(200).json({ message: 'Session closed successfully.' })
}
