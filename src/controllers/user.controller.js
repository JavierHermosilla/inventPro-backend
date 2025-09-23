// src/controllers/users.controller.js
import { Op, col } from 'sequelize'
import User from '../models/user.model.js'
import logger from '../utils/logger.js'
import pick from 'lodash/pick.js'

/**
 * GET /api/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    })
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })
    res.json(user)
  } catch (err) {
    logger.error(`getUserById error: ${err.message}`)
    res.status(500).json({ message: 'Error obteniendo usuario', error: err.message })
  }
}

/**
 * POST /api/users  (solo admin)
 */
export const createUser = async (req, res) => {
  const userIP = req.clientIP
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'No tienes permisos' })

  try {
    const { username, name, email, password, phone, address, avatar, role } = req.body

    // Evitar duplicados (email o username)
    const exists = await User.findOne({
      where: { [Op.or]: [{ email }, { username }] },
      attributes: ['id', 'email', 'username']
    })
    if (exists) {
      const field = exists.email === email ? 'Email' : 'Username'
      return res.status(400).json({ message: `${field} ya registrado` })
    }

    const newUser = await User.create({ username, name, email, password, phone, address, avatar, role })
    logger.info(`User ${req.user.id} creó usuario ${newUser.id}, IP: ${userIP}`)

    res.status(201).json({
      message: 'Usuario creado',
      user: pick(newUser, ['id', 'username', 'name', 'email', 'role', 'phone', 'address', 'avatar'])
    })
  } catch (err) {
    logger.error(`Error creating user: ${err.message}, IP: ${userIP}`)
    res.status(500).json({ message: 'Error creando usuario', error: err.message })
  }
}

/**
 * GET /api/users  (solo admin)
 * Query: page, limit, search
 */
export const listUsers = async (req, res) => {
  const userIP = req.clientIP
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'No tienes permisos' })

  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit

    const search = (req.query.search || '').trim()
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
      // 🔒 Evita "User.createdAt": usa columna física sin prefijo de tabla
      order: [[col('created_at'), 'DESC'], ['id', 'DESC']],
      attributes: { exclude: ['password'] } // redundante por defaultScope, pero seguro
    })

    res.json({
      total: count,
      page,
      pages: Math.ceil(count / limit),
      users: rows
    })
  } catch (err) {
    logger.error(`Error listing users: ${err.message}, IP: ${userIP}`)
    res.status(500).json({ message: 'Error al listar usuarios', error: err.message })
  }
}

/**
 * PUT /api/users/:id
 */
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
    await user.save() // hooks: hash password, updated_at

    res.json({
      message: 'Usuario actualizado',
      user: pick(user, ['id', 'username', 'name', 'email', 'role', 'phone', 'address', 'avatar'])
    })
  } catch (err) {
    logger.error(`Error updating user: ${err.message}, IP: ${userIP}`)
    res.status(500).json({ message: 'Error actualizando usuario', error: err.message })
  }
}

/**
 * DELETE /api/users/:id  (solo admin)
 */
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
