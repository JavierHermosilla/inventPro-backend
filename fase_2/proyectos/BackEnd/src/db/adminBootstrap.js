// src/db/adminBootstrap.js
import bcrypt from 'bcryptjs'
import User from '../models/user.model.js'

/**
 * Crea un usuario admin si no existe, basado en variables de entorno.
 * Pensado para entornos efímeros (Railway) donde la base puede iniciar vacía.
 */
export async function ensureAdminUser () {
  const email = (process.env.ADMIN_EMAIL || 'admin@inventpro.cl').trim().toLowerCase()
  const username = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase()
  const name = process.env.ADMIN_NAME || 'Administrador'
  const password = process.env.ADMIN_PASSWORD || 'Admin123$'

  const existing = await User.scope('withPassword').findOne({ where: { email } })
  if (existing) return false

  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(password, salt)

  await User.create({
    username,
    name,
    email,
    password: hash,
    role: 'admin'
  })
  return true
}
