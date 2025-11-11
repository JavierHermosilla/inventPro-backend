// src/services/user.service.js
import { Op, UniqueConstraintError } from 'sequelize'
import { models } from '../models/index.js'

const { User } = models

export async function createUserService (data, actor) {
  if (actor?.role !== 'admin') {
    const e = new Error('No tienes permisos'); e.status = 403; throw e
  }
  try {
    const exists = await User.findOne({ where: { [Op.or]: [{ email: data.email }, { username: data.username }] } })
    if (exists) { const e = new Error('Email o Username ya registrado'); e.status = 409; throw e }
    const newUser = await User.create(data) // hooks: hash password
    return newUser.toJSON()
  } catch (err) {
    if (err instanceof UniqueConstraintError) { err.status = 409; err.message = 'Email o Username ya registrado' }
    throw err
  }
}

export async function listUsersService (params, actor) {
  if (actor?.role !== 'admin') { const e = new Error('No tienes permisos'); e.status = 403; throw e }
  const page = Math.max(parseInt(params?.page ?? 1, 10), 1)
  const limit = Math.min(Math.max(parseInt(params?.limit ?? 10, 10), 1), 100)
  const offset = (page - 1) * limit
  const where = {}
  const q = (params?.search || '').trim()
  if (q) {
    where[Op.or] = [
      { username: { [Op.iLike]: `%${q}%` } },
      { email: { [Op.iLike]: `%${q}%` } },
      { name: { [Op.iLike]: `%${q}%` } }
    ]
  }
  const { count, rows } = await User.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC'], ['id', 'DESC']],
    attributes: { exclude: ['password'] }
  })
  return { total: count, page, pages: Math.max(Math.ceil(count / limit), 1), users: rows }
}

export async function getUserByIdService (id) {
  const user = await User.findByPk(id, { attributes: { exclude: ['password'] } })
  if (!user) { const e = new Error('Usuario no encontrado'); e.status = 404; throw e }
  return user
}

export async function updateUserService (id, payload, actor) {
  const user = await User.findByPk(id)
  if (!user) { const e = new Error('Usuario no encontrado'); e.status = 404; throw e }

  const allowed = actor?.role === 'admin'
    ? ['username', 'name', 'email', 'phone', 'address', 'avatar', 'role', 'password']
    : ['username', 'name', 'email', 'phone', 'address', 'avatar', 'password']

  // unicidad si cambian email/username
  if (payload.email || payload.username) {
    const exists = await User.findOne({
      where: {
        id: { [Op.ne]: id },
        [Op.or]: [
          payload.email ? { email: payload.email } : null,
          payload.username ? { username: payload.username } : null
        ].filter(Boolean)
      }
    })
    if (exists) { const e = new Error('Email o Username ya registrado'); e.status = 409; throw e }
  }

  for (const k of allowed) if (payload[k] !== undefined) user[k] = payload[k]
  await user.save() // hooks: hash password si cambió
  const { password, ...safe } = user.toJSON()
  return { message: 'Usuario actualizado', user: safe }
}

export async function deleteUserService (id, actor) {
  if (actor?.role !== 'admin') { const e = new Error('No tienes permisos'); e.status = 403; throw e }
  const user = await User.findByPk(id)
  if (!user) { const e = new Error('Usuario no encontrado'); e.status = 404; throw e }
  await user.destroy()
  const { password, ...safe } = user.toJSON()
  return { message: 'Usuario eliminado', user: { id: safe.id, username: safe.username, email: safe.email, role: safe.role } }
}
