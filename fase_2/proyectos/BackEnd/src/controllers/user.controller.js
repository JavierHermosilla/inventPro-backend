// src/controllers/users.controller.js
import logger from '../utils/logger.js'
import {
  createUserService,
  listUsersService,
  getUserByIdService,
  updateUserService,
  deleteUserService
} from '../services/user.service.js'

export const getUserById = async (req, res) => {
  try {
    const user = await getUserByIdService(req.params.id)
    res.json(user)
  } catch (err) {
    logger?.error?.(`getUserById error: ${err.message}`)
    res.status(err.status || 500).json({ message: err.message || 'Error obteniendo usuario' })
  }
}

export const createUser = async (req, res) => {
  try {
    const user = await createUserService(req.body, req.user)
    // oculta password si viniera
    delete user?.password
    res.status(201).json({ message: 'Usuario creado', user })
  } catch (err) {
    logger?.error?.(`createUser error: ${err.message}`)
    res.status(err.status || 500).json({ message: err.message || 'Error creando usuario' })
  }
}

export const listUsers = async (req, res) => {
  try {
    const result = await listUsersService(req.query, req.user)
    res.json(result)
  } catch (err) {
    logger?.error?.(`listUsers error: ${err.message}`)
    res.status(err.status || 500).json({ message: err.message || 'Error al listar usuarios' })
  }
}

export const updateUser = async (req, res) => {
  try {
    const out = await updateUserService(req.params.id, req.body, req.user)
    res.json(out)
  } catch (err) {
    logger?.error?.(`updateUser error: ${err.message}`)
    res.status(err.status || 500).json({ message: err.message || 'Error actualizando usuario' })
  }
}

export const deleteUser = async (req, res) => {
  try {
    const out = await deleteUserService(req.params.id, req.user)
    res.json(out)
  } catch (err) {
    logger?.error?.(`deleteUser error: ${err.message}`)
    res.status(err.status || 500).json({ message: err.message || 'Error eliminando usuario' })
  }
}
