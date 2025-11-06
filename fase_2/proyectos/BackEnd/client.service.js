// src/services/client.service.js
import { Op, UniqueConstraintError, fn, col, where as sqWhere } from 'sequelize'
import { sequelize, models } from '../models/index.js'

const { Client } = models

// ----------------- helpers -----------------
const normRut = (rut) => String(rut ?? '').trim().toUpperCase()
const normEmail = (email) => String(email ?? '').trim().toLowerCase()
// Conservador: solo quita espacios; tu Zod valida el formato (+?\d{7,15})
const normPhone = (phone) => String(phone ?? '').replace(/\s+/g, '').trim()

// ----------------- create -----------------
export async function createClientService (payload) {
  // Normaliza antes de entrar a la TX
  const data = { ...payload }
  if (data.rut) data.rut = normRut(data.rut)
  if (data.email) data.email = normEmail(data.email)
  if (data.phone) data.phone = normPhone(data.phone)

  try {
    return await sequelize.transaction(async (t) => {
      // Chequeo preventivo (activos por defecto: paranoid = true)
      const dup = await Client.findOne({
        where: {
          [Op.or]: [
            data.rut ? { rut: data.rut } : null,
            data.email ? sqWhere(fn('lower', col('email')), data.email) : null
          ].filter(Boolean)
        },
        transaction: t
      })
      if (dup) {
        const e = new Error('Cliente con este RUT o email ya existe'); e.status = 409; throw e
      }

      const client = await Client.create(data, { transaction: t })
      return client.toJSON()
    })
  } catch (err) {
    // Blindaje por si gana la carrera el índice único parcial
    if (err instanceof UniqueConstraintError) {
      err.status = 409
      err.message = 'Cliente con este RUT o email ya existe'
    }
    throw err
  }
}

// ----------------- list (paginado + search) -----------------
/**
 * params: { page=1, limit=10, search, orderBy='created_at', orderDir='DESC' }
 * search: iLike en name, rut, email (email ya es insensitive por citext o iLike)
 */
export async function listClientsService (params = {}) {
  const page = Math.max(parseInt(params.page ?? 1, 10), 1)
  const limit = Math.min(Math.max(parseInt(params.limit ?? 10, 10), 1), 100)
  const offset = (page - 1) * limit

  const where = {}
  const q = String(params.search ?? '').trim()
  if (q) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${q}%` } },
      { rut: { [Op.iLike]: `%${q}%` } },
      { email: { [Op.iLike]: `%${q}%` } }
    ]
  }

  const allowedOrder = ['created_at', 'name', 'rut', 'email', 'updated_at']
  const orderBy = allowedOrder.includes(params.orderBy) ? params.orderBy : 'created_at'
  const orderDir = String(params.orderDir || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

  const { rows, count } = await Client.findAndCountAll({
    where,
    order: [[orderBy, orderDir]],
    limit,
    offset
  })

  return {
    page,
    limit,
    total: count,
    pages: Math.max(Math.ceil(count / limit), 1),
    clients: rows
  }
}

// ----------------- get by id -----------------
export async function getClientByIdService (id) {
  const client = await Client.findByPk(id)
  if (!client) {
    const e = new Error('Cliente no encontrado'); e.status = 404; throw e
  }
  return client
}

// ----------------- update -----------------
export async function updateClientService (id, payload) {
  // Pre-normaliza para que el findOne de unicidad compare contra valores finales
  const data = { ...payload }
  if (data.rut) data.rut = normRut(data.rut)
  if (data.email) data.email = normEmail(data.email)
  if (data.phone) data.phone = normPhone(data.phone)

  try {
    return await sequelize.transaction(async (t) => {
      const client = await Client.findByPk(id, { transaction: t })
      if (!client) {
        const e = new Error('Cliente no encontrado'); e.status = 404; throw e
      }

      // Unicidad si modifican rut/email (contra otros activos)
      if (data.rut || data.email) {
        const dup = await Client.findOne({
          where: {
            id: { [Op.ne]: id },
            [Op.or]: [
              data.rut ? { rut: data.rut } : null,
              data.email ? sqWhere(fn('lower', col('email')), data.email) : null
            ].filter(Boolean)
          },
          transaction: t
        })
        if (dup) {
          const e = new Error('Cliente con este RUT o email ya existe'); e.status = 409; throw e
        }
      }

      await client.update(data, { transaction: t })
      return client.toJSON()
    })
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      err.status = 409
      err.message = 'Cliente con este RUT o email ya existe'
    }
    throw err
  }
}

// ----------------- delete (soft) -----------------
export async function deleteClientService (id) {
  try {
    return await sequelize.transaction(async (t) => {
      const client = await Client.findByPk(id, { transaction: t })
      if (!client) {
        const e = new Error('Cliente no encontrado'); e.status = 404; throw e
      }
      await client.destroy({ transaction: t })
      return true
    })
  } catch (err) {
    throw err
  }
}
