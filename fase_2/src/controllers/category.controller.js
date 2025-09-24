import { Op } from 'sequelize'
import Category from '../models/category.model.js'

// Crear categoría
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body

    // Verificar si ya existe
    const categoryExists = await Category.findOne({ where: { name: name.trim().toLowerCase() } })
    if (categoryExists) {
      return res.status(400).json({ message: 'La categoría ya existe' })
    }

    // Crear directamente (Sequelize ya guarda)
    const newCategory = await Category.create({
      name: name.trim().toLowerCase(),
      description: description?.trim() || ''
    })

    res.status(201).json({
      message: 'Categoría creada correctamente',
      category: newCategory
    })
  } catch (error) {
    res.status(500).json({ message: 'Error al crear categoría', error: error.message })
  }
}

// Listar categorías con paginación y búsqueda
export const listCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const whereClause = search
      ? { name: { [Op.iLike]: `%${search.toLowerCase()}%` } }
      : {}

    const { rows: categories, count: total } = await Category.findAndCountAll({
      where: whereClause,
      offset,
      limit: Number(limit),
      order: [['createdAt', 'DESC']]
    })

    res.json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      categories
    })
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener categorías', error: error.message })
  }
}

// Obtener categoría por ID
export const listCategoryById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id)

    if (!category) {
      return res.status(404).json({ message: 'Categoría no encontrada' })
    }

    res.json(category)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener categoría', error: error.message })
  }
}

// Actualizar categoría
export const updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body
    const category = await Category.findByPk(req.params.id)

    if (!category) {
      return res.status(404).json({ message: 'Categoría no encontrada' })
    }

    if (name) {
      const exists = await Category.findOne({
        where: { name: name.trim(), id: { [Op.ne]: req.params.id } }
      })
      if (exists) {
        return res.status(400).json({ message: 'El nombre ya está en uso por otra categoría' })
      }
      category.name = name.trim()
    }
    if (description !== undefined) category.description = description.trim()

    await category.save()

    res.json({
      message: 'Categoría actualizada correctamente',
      category
    })
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar categoría', error: error.message })
  }
}

// Eliminar categoría (soft delete por paranoid: true)
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id)

    if (!category) {
      return res.status(404).json({ message: 'Categoría no encontrada' })
    }

    await category.destroy()

    res.json({ message: 'Categoría eliminada correctamente' })
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar categoría', error: error.message })
  }
}
