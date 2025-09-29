// src/services/client.service.js
import { Op, UniqueConstraintError } from 'sequelize'
import { sequelize, models } from '../models/index.js'

const { Client } = models

function normalizeRut (rut) {
  return String(rut || '').trim().toUpperCase()
}

export async function createClientService (payload) {
  const t = await sequelize.transaction()
  try {
    const data = { ...payload }
    if (data.rut) data.rut = normalizeRut(data.rut)

    const exists = await Client.findOne({
      where: { [Op.or]: [{ rut: data.rut }, { email: data.email }] },
      transaction: t
    })
    if (exists) {
      throw Object.assign(new Error('Cliente con este RUT o email ya existe'), { status: 409 })
    }

    const client = await Client.create(data, { transaction: t })
    await t.commit()
    return client
  } catch (err) {
    await t.rollback()
    if (err instanceof UniqueConstraintError) {
      err.status = 409
      err.message = 'Cliente con este RUT o email ya existe'
    }
    throw err
  }
}

/**
 * Listado con paginación y filtros:
 * params: { page=1, limit=10, search, orderBy='created_at', orderDir='DESC' }
 * search: busca en name, rut, email (case-insensitive por citext en email)
 */
export async function listClientsService (params = {}) {
  const page = Math.max(parseInt(params.page ?? 1, 10), 1)
  const limit = Math.min(Math.max(parseInt(params.limit ?? 10, 10), 1), 100)
  const offset = (page - 1) * limit

  const where = {}
  const search = (params.search || '').trim()
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { rut: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } } // citext ayuda igual
    ]
  }

  const orderBy = ['created_at', 'name', 'rut', 'email'].includes(params.orderBy)
    ? params.orderBy
    : 'created_at'
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

export async function getClientByIdService (id) {
  const client = await Client.findByPk(id)
  if (!client) {
    const e = new Error('Cliente no encontrado')
    e.status = 404
    throw e
  }
  return client
}

export async function updateClientService (id, payload) {
  const t = await sequelize.transaction()
  try {
    const client = await Client.findByPk(id, { transaction: t })
    if (!client) {
      await t.rollback()
      const e = new Error('Cliente no encontrado')
      e.status = 404
      throw e
    }

    const data = { ...payload }
    if (data.rut) data.rut = normalizeRut(data.rut)

    // Si cambian rut/email, valida unicidad contra otros activos
    if (data.rut || data.email) {
      const exists = await Client.findOne({
        where: {
          id: { [Op.ne]: id },
          [Op.or]: [
            data.rut ? { rut: data.rut } : null,
            data.email ? { email: data.email } : null
          ].filter(Boolean)
        },
        transaction: t
      })
      if (exists) {
        await t.rollback()
        const e = new Error('Cliente con este RUT o email ya existe')
        e.status = 409
        throw e
      }
    }

    await client.update(data, { transaction: t })
    await t.commit()
    return client
  } catch (err) {
    await t.rollback()
    if (err instanceof UniqueConstraintError) {
      err.status = 409
      err.message = 'Cliente con este RUT o email ya existe'
    }
    throw err
  }
}

export async function deleteClientService (id) {
  const t = await sequelize.transaction()
  try {
    const client = await Client.findByPk(id, { transaction: t })
    if (!client) {
      await t.rollback()
      const e = new Error('Cliente no encontrado')
      e.status = 404
      throw e
    }
    await client.destroy({ transaction: t }) // paranoid: true → soft delete
    await t.commit()
    return { message: 'Cliente eliminado correctamente' }
  } catch (err) {
    await t.rollback()
    throw err
  }
}
