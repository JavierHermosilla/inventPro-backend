import Supplier from '../models/supplier.model.js'
import pick from 'lodash/pick.js'
import logger from '../utils/logger.js'
import { supplierAllowedFields } from '../config/allowedFields.js'
import { supplierSchema, updateSupplierSchema } from '../schemas/supplier.schema.js'
import { Op } from 'sequelize'

// Crear Supplier
export const createSupplier = async (req, res) => {
  const userIP = req.clientIP
  try {
    const parsed = supplierSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Validation error', errors: parsed.error.errors })

    const exists = await Supplier.findOne({ where: { rut: parsed.data.rut } })
    if (exists) return res.status(400).json({ message: 'Supplier with this RUT already exists.' })

    const supplier = await Supplier.create(parsed.data)
    logger.info(`[AUDIT] user ${req.user.id} created supplier ${supplier.id}, IP: ${userIP}`)
    res.status(201).json({ message: 'Supplier created successfully.', supplier })
  } catch (err) {
    logger.error('Error creating supplier', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: 'Error creating supplier.', error: err.message })
  }
}

// Actualizar Supplier
export const updateSupplier = async (req, res) => {
  const { id } = req.params
  const userIP = req.clientIP
  try {
    const parsed = updateSupplierSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ message: 'Validation error', errors: parsed.error.errors })

    if (parsed.data.rut) {
      const duplicate = await Supplier.findOne({ where: { rut: parsed.data.rut, id: { [Op.ne]: id } } })
      if (duplicate) return res.status(400).json({ message: 'Another supplier with this RUT already exists.' })
    }

    const supplier = await Supplier.findByPk(id)
    if (!supplier) return res.status(404).json({ message: 'Supplier not found.' })

    await supplier.update(pick(parsed.data, supplierAllowedFields))
    logger.info(`[AUDIT] user ${req.user.id} updated supplier ${supplier.id}, IP: ${userIP}`)
    res.json({ message: 'Supplier updated.', supplier })
  } catch (err) {
    logger.error('Error updating supplier', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: 'Error updating supplier.', error: err.message })
  }
}

// Listar Suppliers
export const listSuppliers = async (req, res) => {
  const userIP = req.clientIP
  try {
    const suppliers = await Supplier.findAll()
    logger.info(`Suppliers listed, IP: ${userIP}`)
    res.json({ suppliers })
  } catch (err) {
    logger.error('Error fetching suppliers', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: 'Error fetching suppliers.', error: err.message })
  }
}

// Obtener Supplier por ID
export const supplierById = async (req, res) => {
  const { id } = req.params
  const userIP = req.clientIP
  try {
    const supplier = await Supplier.findByPk(id)
    if (!supplier) return res.status(404).json({ message: 'Supplier not found.' })
    res.json({ supplier })
  } catch (err) {
    logger.error('Error fetching supplier', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: 'Error fetching supplier.', error: err.message })
  }
}

// Eliminar Supplier
export const deleteSupplier = async (req, res) => {
  const { id } = req.params
  const userIP = req.clientIP
  try {
    const supplier = await Supplier.findByPk(id)
    if (!supplier) return res.status(404).json({ message: 'Supplier not found.' })

    await supplier.destroy()
    logger.info(`[AUDIT] user ${req.user.id} deleted supplier ${supplier.id}, IP: ${userIP}`)
    res.json({ message: 'Supplier deleted successfully.', supplier })
  } catch (err) {
    logger.error('Error deleting supplier', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: 'Error deleting supplier.', error: err.message })
  }
}
