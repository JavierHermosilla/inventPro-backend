import Category from '../models/category.model.js'

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body

    const categoryExists = await Category.findOne({ name: name.trim() })
    if (categoryExists) {
      return res.status(400).json({ message: 'La categoría ya existe' })
    }

    const newCategory = new Category({
      name: name.trim(),
      description: description?.trim() || ''
    })

    await newCategory.save()

    res.status(201).json({
      message: 'Categoría creada correctamente',
      category: newCategory
    })
  } catch (error) {
    res.status(500).json({ message: 'Error al crear categoría', error: error.message })
  }
}

export const listCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query

    const query = search
      ? { name: { $regex: search, $options: 'i' } }
      : {}

    const categories = await Category.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })

    const total = await Category.countDocuments(query)

    res.json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      categories
    })
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener categorías', error: error.message })
  }
}

export const listCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)

    if (!category) {
      return res.status(404).json({ message: 'Categoría no encontrada' })
    }

    res.json(category)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener categoría', error: error.message })
  }
}

export const updateCategory = async (req, res) => {
  try {
    const updates = {}

    if (req.body.name !== undefined) {
      updates.name = req.body.name.trim()
    }

    if (req.body.description !== undefined) {
      updates.description = req.body.description.trim() || ''
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No hay campos para actualizar' })
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    )

    if (!updatedCategory) {
      return res.status(404).json({ message: 'Categoría no encontrada' })
    }

    res.json({
      message: 'Categoría actualizada correctamente',
      category: updatedCategory
    })
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar categoría', error: error.message })
  }
}

export const deleteCategory = async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id)

    if (!deletedCategory) {
      return res.status(404).json({ message: 'Categoría no encontrada' })
    }

    res.json({ message: 'Categoría eliminada correctamente' })
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar categoría', error: error.message })
  }
}
