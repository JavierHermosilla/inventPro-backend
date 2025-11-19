// src/services/reports.service.js
import Report from '../models/reports.model.js'
import User from '../models/user.model.js'
import { Op, col } from 'sequelize'
import logger from '../utils/logger.js'

const ALLOWED_STATUSES = ['active', 'archived', 'draft']
const ALLOWED_FORMATS = ['pdf', 'xls', 'dashboard']

const normalizeString = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '')

const createBadRequestError = (message) => {
  const err = new Error(message)
  err.status = 400
  return err
}

export const listReports = async ({ page = 1, limit = 10, search, status, type }) => {
  try {
    const pageInt = Math.max(parseInt(page, 10) || 1, 1)
    const limitInt = Math.max(parseInt(limit, 10) || 10, 1)
    const offset = (pageInt - 1) * limitInt

    const where = {}
    const normalizedStatus = normalizeString(status)
    if (normalizedStatus) {
      if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
        throw createBadRequestError(`Filtro de estado inválido. Valores permitidos: ${ALLOWED_STATUSES.join(', ')}`)
      }
      where.status = normalizedStatus
    }

    const normalizedType = normalizeString(type)
    if (normalizedType) {
      // Si coincide con alguno de los estados permitidos, asumimos que el usuario lo puso en el filtro equivocado
      if (ALLOWED_STATUSES.includes(normalizedType)) {
        if (normalizedStatus && normalizedStatus !== normalizedType) {
          throw createBadRequestError(`Combinación de filtros inválida. Usa 'status=${normalizedStatus}' y 'type=${ALLOWED_FORMATS.join(', ')}'.`)
        }
        where.status = normalizedType
      } else if (ALLOWED_FORMATS.includes(normalizedType)) {
        where.format = normalizedType
      } else {
        throw createBadRequestError(`Filtro de formato inválido. Valores permitidos: ${ALLOWED_FORMATS.join(', ')}`)
      }
    }

    if (search) where.name = { [Op.iLike]: `%${search}%` }

    const { count, rows } = await Report.findAndCountAll({
      where,
      limit: limitInt,
      offset,
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }],
      order: [[col('created_at'), 'DESC']]
    })

    return {
      page: pageInt,
      totalPages: Math.ceil(count / limitInt),
      totalItems: count,
      reports: rows
    }
  } catch (error) {
    logger.error(`Error listing reports: ${error.message}`, { stack: error.stack })
    throw new Error('Error retrieving reports')
  }
}
