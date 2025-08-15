import mongoose from 'mongoose'
import pick from 'lodash/pick.js'
import Supplier from '../models/supplier.model.js'
import logger from '../utils/logger.js'
import { supplierAllowedFields } from '../config/allowedFields.js'
import { supplierSchema, updateSupplierSchema } from '../schemas/supplier.schema.js'

export const createSupplier = async (req, res) => {
  const userIP = req.clientIP
  try {
    // Validar req.body con Zod
    const parsed = supplierSchema.safeParse(req.body)
    if (!parsed.success) {
      logger.warn(`[AUDIT] user ${req.user.id} failed supplier validation, IP: ${userIP}`)
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.errors })
    }

    const { rut } = parsed.data

    // Verificar si ya existe un supplier con el mismo RUT
    const existingSupplier = await Supplier.findOne({ rut })
    if (existingSupplier) {
      logger.warn(`[AUDIT] user ${req.user.id} tried to create duplicate supplier with RUT ${rut}, IP: ${userIP}`)
      return res.status(400).json({ message: 'Supplier with this RUT already exists.' })
    }

    const newSupplier = new Supplier(parsed.data)
    await newSupplier.save()

    logger.info(`[AUDIT] user ${req.user.id} created supplier ${newSupplier._id} (${newSupplier.name || ''}), IP: ${userIP}`)
    res.status(201).json({ message: 'Supplier created successfully.', supplier: newSupplier })
  } catch (err) {
    logger.error('Error creating supplier', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: 'Error creating supplier.', error: err.message })
  }
}

export const updateSupplier = async (req, res) => {
  const userIP = req.clientIP
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    logger.warn(`Invalid supplier ID for update: ${req.params.id}, IP: ${userIP}`)
    return res.status(400).json({ message: 'Invalid supplier ID.' })
  }
  try {
    // Validar datos de actualización
    const parsed = updateSupplierSchema.safeParse(req.body)
    if (!parsed.success) {
      logger.warn(`[AUDIT] user ${req.user.id} failed supplier update validation, IP: ${userIP}`)
      return res.status(400).json({ message: 'Validation error', errors: parsed.error.errors })
    }

    // Evitar duplicar RUT en actualización
    if (parsed.data.rut) {
      const duplicate = await Supplier.findOne({ rut: parsed.data.rut, _id: { $ne: req.params.id } })
      if (duplicate) {
        logger.warn(`[AUDIT] user ${req.user.id} tried to update supplier with duplicate RUT ${parsed.data.rut}, IP: ${userIP}`)
        return res.status(400).json({ message: 'Another supplier with this RUT already exists.' })
      }
    }

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      pick(parsed.data, supplierAllowedFields),
      { new: true, runValidators: true }
    )

    if (!updatedSupplier) {
      logger.warn(`Supplier not found for update: ${req.params.id}, IP: ${userIP}`)
      return res.status(404).json({ message: 'Supplier not found.' })
    }

    logger.info(`[AUDIT] user ${req.user.id} updated supplier ${updatedSupplier._id} (${updatedSupplier.name || ''}), IP: ${userIP}`)
    res.json({ message: 'Supplier updated.', supplier: updatedSupplier })
  } catch (err) {
    logger.error('Error updating supplier', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: 'Error updating supplier.', error: err.message })
  }
}

// Listado, obtención por ID y eliminación se mantienen igual
export const listSuppliers = async (req, res) => {
  const userIP = req.clientIP
  try {
    const suppliers = await Supplier.find()
    logger.info(`Suppliers listed, IP: ${userIP}`)
    res.json({ suppliers }) // ✅ ahora devuelve { suppliers: [...] }
  } catch (err) {
    logger.error('Error fetching suppliers', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: 'Error fetching suppliers.', error: err.message })
  }
}

export const supplierById = async (req, res) => {
  const userIP = req.clientIP
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    logger.warn(`Invalid supplier ID: ${req.params.id}, IP: ${userIP}`)
    return res.status(400).json({ message: 'Invalid supplier ID.' })
  }
  try {
    const supplier = await Supplier.findById(req.params.id)
    if (!supplier) {
      logger.warn(`Supplier not found: ${req.params.id}, IP: ${userIP}`)
      return res.status(404).json({ message: 'Supplier not found.' })
    }
    logger.info(`Supplier retrieved by ID: ${req.params.id}, IP: ${userIP}`)
    res.json({ supplier }) // ✅ ahora devuelve { supplier: ... }
  } catch (err) {
    logger.error('Error fetching supplier by ID', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: 'Error fetching supplier.', error: err.message })
  }
}

export const deleteSupplier = async (req, res) => {
  const userIP = req.clientIP
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    logger.warn(`Invalid supplier ID for delete: ${req.params.id}, IP: ${userIP}`)
    return res.status(400).json({ message: 'Invalid supplier ID.' })
  }
  try {
    const deletedSupplier = await Supplier.findByIdAndDelete(req.params.id)
    if (!deletedSupplier) {
      logger.warn(`Supplier not found for delete: ${req.params.id}, IP: ${userIP}`)
      return res.status(404).json({ message: 'Supplier not found.' })
    }
    logger.info(`[AUDIT] user ${req.user.id} deleted supplier ${deletedSupplier._id} (${deletedSupplier.name || ''}), IP: ${userIP}`)
    res.json({ message: 'Supplier deleted successfully.', supplier: deletedSupplier }) // ✅ coincide con test
  } catch (err) {
    logger.error('Error deleting supplier', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: 'Error deleting supplier.', error: err.message })
  }
}
