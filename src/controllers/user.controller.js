import mongoose from 'mongoose'
import User from '../models/user.model.js'
import pick from 'lodash/pick.js'
import logger from '../utils/logger.js'
import bcrypt from 'bcryptjs'

// crear nuevo usuario (solo admin)
export const createUser = async (req, res) => {
  const userIP = req.clientIP

  try {
    const isAdmin = req.user?.role === 'admin'
    if (!isAdmin) {
      logger.warn(`User ${req.user.id} attempted to create a user without admin rights, IP: ${userIP}`)
      return res.status(403).json({ message: 'No tienes permisos para crear usuarios.' })
    }

    const { username, name, email, password, phone, address, avatar, role } = req.body

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      logger.warn(`Email already in use: ${email}, IP: ${userIP}`)
      return res.status(400).json({ message: 'El email ya está registrado.' })
    }

    let finalPassword = password

    // Solo hashear si NO parece ser un hash de bcrypt
    if (!password.startsWith('$2')) {
      const salt = await bcrypt.genSalt(10)
      finalPassword = await bcrypt.hash(password, salt)
    }

    // Crear usuario
    const newUser = new User({
      username,
      name,
      email,
      password: finalPassword,
      phone,
      address,
      avatar,
      role
    })

    await newUser.save()

    logger.info(`[AUDIT] user ${req.user.id} created user ${newUser._id}, IP: ${userIP}`)

    const userResponse = newUser.toObject()
    delete userResponse.password

    res.status(201).json({ message: 'Usuario creado exitosamente', user: userResponse })
  } catch (err) {
    logger.error('Error creating user', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: 'Error al crear el usuario.', error: err.message })
  }
}

// Listar todos los usuarios (solo admin)
export const listUsers = async (req, res) => {
  const userIP = req.clientIP
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const search = req.query.search || ''
    const roleFilter = req.query.role

    const filter = {}

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ]
    }

    if (roleFilter) {
      filter.role = roleFilter
    }

    const total = await User.countDocuments(filter)
    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    logger.info(`Listed users, page ${page}, IP: ${userIP}`)
    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      users
    })
  } catch (err) {
    logger.error('Error fetching users', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: 'Error fetching users.', error: err.message })
  }
}

// Obtener usuario por ID (admin o propio usuario)
export const userById = async (req, res) => {
  const userIP = req.clientIP
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    logger.warn(`Invalid user ID: ${req.params.id}, IP: ${userIP}`)
    return res.status(400).json({ message: 'Invalid user ID.' })
  }

  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) {
      logger.warn(`User not found: ${req.params.id}, IP: ${userIP}`)
      return res.status(404).json({ message: 'User not found' })
    }
    logger.info(`Fetched user by ID: ${req.params.id}, IP: ${userIP}`)
    res.json(user)
  } catch (err) {
    logger.error('Error fetching user by ID', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: err.message })
  }
}

// Actualizar usuario (admin o propio usuario)
export const updateUser = async (req, res) => {
  const userIP = req.clientIP

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    logger.warn(`Invalid user ID for update: ${req.params.id}, IP: ${userIP}`)
    return res.status(400).json({ message: 'Invalid user ID.' })
  }

  try {
    const isAdmin = req.user?.role === 'admin'
    const allowedFields = isAdmin
      ? ['username', 'name', 'email', 'phone', 'address', 'avatar', 'role', 'password']
      : ['username', 'name', 'email', 'phone', 'address', 'avatar', 'password']

    const dataToUpdate = pick(req.body, allowedFields)

    if (dataToUpdate.password) {
      // Solo hashear si NO parece ser un hash de bcrypt
      if (!dataToUpdate.password.startsWith('$2')) {
        const salt = await bcrypt.genSalt(10)
        dataToUpdate.password = await bcrypt.hash(dataToUpdate.password, salt)
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      dataToUpdate,
      { new: true, runValidators: true }
    ).select('-password')

    if (!updatedUser) {
      logger.warn(`User not found for update: ${req.params.id}, IP: ${userIP}`)
      return res.status(404).json({ message: 'User not found' })
    }

    logger.info(`[AUDIT] user ${req.user.id} updated user ${updatedUser._id}, IP: ${userIP}`)
    res.json({ message: 'User updated successfully', user: updatedUser })
  } catch (err) {
    logger.error('Error updating user', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: 'Error updating the user.', error: err.message })
  }
}
// Eliminar usuario (solo admin)
export const deleteUser = async (req, res) => {
  const userIP = req.clientIP
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    logger.warn(`Invalid user ID for delete: ${req.params.id}, IP: ${userIP}`)
    return res.status(400).json({ message: 'Invalid user ID.' })
  }

  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id)
    if (!deletedUser) {
      logger.warn(`User not found for delete: ${req.params.id}, IP: ${userIP}`)
      return res.status(404).json({ message: 'User not found.' })
    }

    logger.info(`[AUDIT] user ${req.user.id} deleted user ${deletedUser._id}, IP: ${userIP}`)
    res.json({ message: 'User deleted successfully', user: deletedUser })
  } catch (err) {
    logger.error('Error deleting user', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: 'Error deleting the user.', error: err.message })
  }
}
