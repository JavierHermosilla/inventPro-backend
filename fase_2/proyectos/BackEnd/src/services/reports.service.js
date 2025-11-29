import Report from '../models/reports.model.js'
import { Op, col } from 'sequelize'
import logger from '../utils/logger.js'

export const listReports = async ({ page = 1, limit = 10, search, status, type }) => {
  try {
    const pageInt = Math.max(parseInt(page, 10) || 1, 1)
    const limitInt = Math.max(parseInt(limit, 10) || 10, 1)
    const offset = (pageInt - 1) * limitInt

    const where = {}
    if (status) where.status = status
    if (type) where.type = type
    if (search) where.name = { [Op.iLike]: `%${search}%` }

    const includeCreator = Report.associations?.creator
      ? [{ association: 'creator', attributes: ['id', 'name', 'email'] }]
      : []

    if (includeCreator.length === 0) {
      logger.warn('Asociación Report→User no encontrada; se omite el include de creator')
    }

    const { count, rows } = await Report.findAndCountAll({
      where,
      limit: limitInt,
      offset,
      include: includeCreator,
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
