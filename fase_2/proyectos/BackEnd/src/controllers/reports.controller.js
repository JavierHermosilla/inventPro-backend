import Report from '../models/reports.model.js'
import User from '../models/user.model.js'
import { createReportSchema, updateReportSchema } from '../schemas/reports.schema.js'
import { listReports } from '../services/reports.service.js'
import logger from '../utils/logger.js'

// =====================
// Crear un nuevo reporte
// =====================
export const createReport = async (req, res) => {
  try {
    const parsed = createReportSchema.parse(req.body)
    parsed.createdBy = req.user.id
    const report = await Report.create(parsed)
    res.status(201).json(report)
  } catch (error) {
    if (error.name === 'ZodError') {
      logger.warn(`Validation failed creating report: ${JSON.stringify(error.errors)}`)
      return res.status(400).json({ errors: error.errors })
    }
    logger.error(`Error creating report: ${error.message}`, { stack: error.stack })
    return res.status(500).json({ error: error.message })
  }
}

// =====================
// Listar todos los reportes
// =====================
export const getReports = async (req, res) => {
  try {
    const data = await listReports(req.query)
    res.json(data)
  } catch (err) {
    logger.error(`Error fetching reports: ${err.message}`, { stack: err.stack })
    res.status(500).json({ error: err.message })
  }
}

// =====================
// Obtener un reporte por ID
// =====================
export const getReportById = async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'] }]
    })
    if (!report) {
      logger.warn(`Report not found with id: ${req.params.id}`)
      return res.status(404).json({ error: 'Reporte no encontrado' })
    }
    res.json(report)
  } catch (error) {
    logger.error(`Error fetching report by id: ${error.message}`, { stack: error.stack })
    res.status(500).json({ error: error.message })
  }
}

// =====================
// Actualizar un reporte
// =====================
export const updateReport = async (req, res) => {
  try {
    const parsed = updateReportSchema.parse(req.body)

    const report = await Report.findByPk(req.params.id)
    if (!report) {
      return res.status(404).json({ error: 'Reporte no encontrado' })
    }

    // 🔹 Merge de filtros (si vienen en la request)
    if (parsed.filters) {
      report.filters = { ...report.filters, ...parsed.filters }
    }

    // 🔹 Actualizar resto de campos
    const { filters, ...rest } = parsed
    await report.update({ ...rest, filters: report.filters })

    res.json(report)
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ errors: error.errors })
    }
    return res.status(500).json({ error: error.message })
  }
}

// =====================
// Eliminar un reporte (soft delete)
// =====================
export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id)
    if (!report) {
      logger.warn(`Attempt to delete non-existent report with id: ${req.params.id}`)
      return res.status(404).json({ error: 'Reporte no encontrado' })
    }
    await report.destroy()
    logger.info(`Report deleted successfully: id ${req.params.id}, by user ${req.user.id}`)
    res.json({ message: 'Reporte eliminado correctamente' })
  } catch (error) {
    logger.error(`Error deleting report: ${error.message}`, { stack: error.stack })
    res.status(500).json({ error: error.message })
  }
}
