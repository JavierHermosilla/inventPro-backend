import { Op } from 'sequelize'
import User from '../models/user.model.js'
import logger from '../utils/logger.js'
import pick from 'lodash/pick.js'
import { createAccessToken } from '../libs/jwt.js'

// Registro de usuario
export const register = async (req, res) => {
  const userIP = req.clientIP
  try {
    const { username, name, email, password, phone, address, avatar, role } = req.body

    // Solo roles permitidos
    const allowedRoles = ['user', 'manager']
    const safeRole = allowedRoles.includes(role) ? role : 'user'

    // Verificar si email ya existe
    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      logger.warn(`Duplicate email registration: ${email}, IP: ${userIP}`)
      return res.status(400).json({ message: 'El correo ya está en uso.' })
    }

    const userSaved = await User.create({ username, name, email, password, phone, address, avatar, role: safeRole })

    const token = await createAccessToken({ id: userSaved.id })
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' })

    logger.info(`User registered successfully: ${email}, IP: ${userIP}`)

    res.status(201).json(pick(userSaved, ['id', 'username', 'name', 'email', 'role', 'phone', 'address', 'avatar', 'createdAt', 'updatedAt']))
  } catch (err) {
    logger.error(`Registration error: ${err.message}, IP: ${userIP}`, { stack: err.stack })
    res.status(500).json({ message: err.message })
  }
}

// Login
export const login = async (req, res) => {
  const userIP = req.clientIP
  try {
    const { email, password } = req.body

    // 👉 Aquí el cambio importante
    const userFound = await User.scope('withPassword').findOne({ where: { email } })

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
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' })

    logger.info(`Login successful: ${email}, IP: ${userIP}`)

    // 👉 no retornamos la password jamás
    res.status(200).json({
      token,
      ...pick(userFound, [
        'id',
        'username',
        'name',
        'email',
        'role',
        'phone',
        'address',
        'avatar',
        'createdat', // <-- aquí
        'updatedat' // <-- y aquí
      ])
    })
  } catch (err) {
    logger.error(`Login error: ${err.message}, IP: ${userIP}`)
    res.status(500).json({ message: err.message })
  }
}

// Perfil
export const profile = async (req, res) => {
  const userIP = req.clientIP
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' })

    const user = await User.findByPk(req.userId, { attributes: { exclude: ['password'] } })
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })

    res.json(user)
  } catch (err) {
    logger.error(`Profile error: ${err.message}, userId: ${req.userId}, IP: ${userIP}`)
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

// Crear usuario (solo admin)
export const createUser = async (req, res) => {
  const userIP = req.clientIP
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'No tienes permisos' })

  try {
    const { username, name, email, password, phone, address, avatar, role } = req.body
    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) return res.status(400).json({ message: 'Email ya registrado' })

    const newUser = await User.create({ username, name, email, password, phone, address, avatar, role })
    logger.info(`User ${req.user.id} creó usuario ${newUser.id}, IP: ${userIP}`)

    res.status(201).json({ message: 'Usuario creado', user: pick(newUser, ['id', 'username', 'name', 'email', 'role', 'phone', 'address', 'avatar']) })
  } catch (err) {
    logger.error(`Error creating user: ${err.message}, IP: ${userIP}`)
    res.status(500).json({ message: 'Error creando usuario', error: err.message })
  }
}

// Listar usuarios (solo admin)
export const listUsers = async (req, res) => {
  const userIP = req.clientIP
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'No tienes permisos' })

  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit

    const search = req.query.search || ''
    const where = {}
    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { name: { [Op.iLike]: `%${search}%` } }
      ]
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] }
    })

    res.json({ total: count, page, pages: Math.ceil(count / limit), users: rows })
  } catch (err) {
    logger.error(`Error listing users: ${err.message}, IP: ${userIP}`)
    res.status(500).json({ message: 'Error al listar usuarios', error: err.message })
  }
}

// Actualizar usuario
export const updateUser = async (req, res) => {
  const userIP = req.clientIP
  const id = req.params.id

  try {
    const user = await User.findByPk(id)
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })

    const allowedFields = req.user?.role === 'admin'
      ? ['username', 'name', 'email', 'phone', 'address', 'avatar', 'role', 'password']
      : ['username', 'name', 'email', 'phone', 'address', 'avatar', 'password']

    Object.assign(user, pick(req.body, allowedFields))

    await user.save() // 👉 aquí se ejecutan los hooks (hash password, updatedAt, etc.)

    res.json({
      message: 'Usuario actualizado',
      user: pick(user, ['id', 'username', 'name', 'email', 'role', 'phone', 'address', 'avatar'])
    })
  } catch (err) {
    logger.error(`Error updating user: ${err.message}, IP: ${userIP}`)
    res.status(500).json({ message: 'Error actualizando usuario', error: err.message })
  }
}
// Eliminar usuario (solo admin)
export const deleteUser = async (req, res) => {
  const userIP = req.clientIP
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'No tienes permisos' })

  try {
    const userToDelete = await User.findByPk(req.params.id)
    if (!userToDelete) return res.status(404).json({ message: 'Usuario no encontrado' })

    await userToDelete.destroy()
    logger.info(`User ${req.user.id} eliminó usuario ${userToDelete.id}, IP: ${userIP}`)
    res.json({ message: 'Usuario eliminado', user: pick(userToDelete, ['id', 'username', 'email', 'role']) })
  } catch (err) {
    logger.error(`Error deleting user: ${err.message}, IP: ${userIP}`)
    res.status(500).json({ message: 'Error eliminando usuario', error: err.message })
  }
}
