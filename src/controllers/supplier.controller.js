import mongoose from 'mongoose'
import pick from 'lodash/pick.js'
import Supplier from '../models/supplier.model.js'
import logger from '../utils/logger.js'
import { supplierAllowedFields } from '../config/allowedFields.js'

export const createSupplier = async (req, res) => {
  const userIP = req.clientIP
  try {
    const newSupplier = new Supplier(pick(req.body, supplierAllowedFields))
    await newSupplier.save()

    logger.info(`[AUDIT] user ${req.user.id} created supplier ${newSupplier._id} (${newSupplier.name || ''}), IP: ${userIP}`)
    res.status(201).json({ message: 'Supplier created successfully.', supplier: newSupplier })
  } catch (err) {
    logger.error('Error creating supplier', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: 'Error creating supplier.', error: err.message })
  }
}

export const listSuppliers = async (req, res) => {
  const userIP = req.clientIP
  try {
    const suppliers = await Supplier.find()
    logger.info(`Suppliers listed, IP: ${userIP}`)
    res.json(suppliers)
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
    res.json(supplier)
  } catch (err) {
    logger.error('Error fetching supplier by ID', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: 'Error fetching supplier.', error: err.message })
  }
}

export const updateSupplier = async (req, res) => {
  const userIP = req.clientIP
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    logger.warn(`Invalid supplier ID for update: ${req.params.id}, IP: ${userIP}`)
    return res.status(400).json({ message: 'Invalid supplier ID.' })
  }
  try {
    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      pick(req.body, supplierAllowedFields),
      {
        new: true,
        runValidators: true
      }
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
    res.json({ message: 'Supplier deleted.', supplier: deletedSupplier })
  } catch (err) {
    logger.error('Error deleting supplier', { message: err.message, stack: err.stack, IP: userIP })
    res.status(500).json({ message: 'Error deleting supplier.', error: err.message })
  }
}
