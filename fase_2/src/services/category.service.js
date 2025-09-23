// src/services/category.service.js
import { Op } from 'sequelize'
import Category from '../models/category.model.js'

export async function createCategoryService ({ name, description }) {
  // normalizamos igual que el modelo/hook
  const normalized = String(name ?? '').trim().toLowerCase()
  const exists = await Category.findOne({ where: { name: normalized } })
  if (exists) {
    const err = new Error('La categoría ya existe')
    err.status = 400
    throw err
  }
  const category = await Category.create({
    name: normalized,
    description: description?.trim() || null
  })
  return category
}

export async function listCategoriesService ({ page = 1, limit = 10, search = '' }) {
  const pageInt = Math.max(parseInt(page, 10) || 1, 1)
  const limitInt = Math.max(parseInt(limit, 10) || 10, 1)
  const offset = (pageInt - 1) * limitInt

  const where = search
    ? { name: { [Op.iLike]: `%${String(search).toLowerCase()}%` } }
    : {}

  const { rows, count } = await Category.findAndCountAll({
    where,
    offset,
    limit: limitInt,
    order: [['created_at', 'DESC']] // ojo: usamos underscored en DB
  })

  return {
    total: count,
    page: pageInt,
    pages: Math.ceil(count / limitInt),
    categories: rows
  }
}

export async function getCategoryByIdService (id) {
  const category = await Category.findByPk(id)
  if (!category) {
    const err = new Error('Categoría no encontrada')
    err.status = 404
    throw err
  }
  return category
}

export async function updateCategoryService (id, { name, description }) {
  const category = await Category.findByPk(id)
  if (!category) {
    const err = new Error('Categoría no encontrada')
    err.status = 404
    throw err
  }

  if (name) {
    const normalized = String(name).trim().toLowerCase()
    const exists = await Category.findOne({
      where: { name: normalized, id: { [Op.ne]: id } }
    })
    if (exists) {
      const err = new Error('El nombre ya está en uso por otra categoría')
      err.status = 400
      throw err
    }
    category.name = normalized
  }
  if (description !== undefined) category.description = String(description ?? '').trim() || null

  await category.save()
  return category
}

export async function deleteCategoryService (id) {
  const category = await Category.findByPk(id)
  if (!category) {
    const err = new Error('Categoría no encontrada')
    err.status = 404
    throw err
  }
  await category.destroy()
  return { message: 'Categoría eliminada correctamente' }
}
