// src/services/supplier.service.js
import { Op } from 'sequelize'
import { models } from '../models/index.js'
const { Supplier, Product } = models

export async function createSupplierService (data) {
  const exists = await Supplier.findOne({ where: { [Op.or]: [{ rut: data.rut }, { email: data.email }] } })
  if (exists) { const e = new Error('Proveedor con RUT o email ya existe'); e.status = 409; throw e }
  return Supplier.create(data)
}

export async function updateSupplierService (id, data) {
  const s = await Supplier.findByPk(id)
  if (!s) { const e = new Error('Proveedor no encontrado'); e.status = 404; throw e }
  if (data.rut || data.email) {
    const exists = await Supplier.findOne({
      where: { id: { [Op.ne]: id }, [Op.or]: [data.rut ? { rut: data.rut } : null, data.email ? { email: data.email } : null].filter(Boolean) }
    })
    if (exists) { const e = new Error('Proveedor con RUT o email ya existe'); e.status = 409; throw e }
  }
  await s.update(data)
  return s
}

export async function deleteSupplierService (id) {
  const s = await Supplier.findByPk(id)
  if (!s) { const e = new Error('Proveedor no encontrado'); e.status = 404; throw e }
  const count = await Product.count({ where: { supplierId: id } })
  if (count > 0) { const e = new Error('No se puede eliminar: tiene productos asociados'); e.status = 409; throw e }
  await s.destroy()
  return { message: 'Proveedor eliminado' }
}
