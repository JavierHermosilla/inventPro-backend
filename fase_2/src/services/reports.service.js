import Report from '../models/reports.model.js'
import User from '../models/user.model.js'
import { Op } from 'sequelize'
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

    const { count, rows } = await Report.findAndCountAll({
      where,
      limit: limitInt,
      offset,
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']]
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
