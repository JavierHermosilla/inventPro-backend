import pick from 'lodash/pick.js'
import Supplier from '../models/supplier.model.js'
import { supplierAllowedFields } from '../config/allowedFields.js'

export const createSupplier = async (req, res) => {
  try {
    const newSupplier = new Supplier(pick(req.body, supplierAllowedFields))
    await newSupplier.save()
    res.status(201).json({ message: 'Supplier created successfully.', supplier: newSupplier })
  } catch (err) {
    res.status(500).json({ message: 'Error crating supplier.', error: err.message })
  }
}

export const listSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find()
    res.json(suppliers)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching suppliers.', error: err.message })
  }
}

export const supplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id)
    if (!supplier) return res.status(404).json({ message: 'Supplier not found.' })
    res.json(supplier)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching supplier.', error: err.message })
  }
}

export const updateSupplier = async (req, res) => {
  try {
    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      pick(req.body, supplierAllowedFields), {
        new: true,
        runvalidators: true
      })
    if (!updatedSupplier) return res.status(404).json({ message: 'Supplier not found.' })
    res.json({ message: 'Supplier update.', supplier: updatedSupplier })
  } catch (err) {
    res.status(500).json({ message: 'Error updating supplier.', error: err.message })
  }
}

export const deleteSupplier = async (req, res) => {
  try {
    const deletedSupplier = await Supplier.findByIdAndDelete(req.params.id)
    if (!deletedSupplier) return res.status(404).json({ message: 'Supplier not found' })
    res.json({ message: 'Supplier deleted.', supplier: deletedSupplier })
  } catch (err) {
    res.status(500).json({ message: 'Error deleting supplier.', error: err.message })
  }
}
