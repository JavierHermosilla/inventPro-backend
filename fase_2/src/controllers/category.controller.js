import {
  createCategoryService,
  listCategoriesService,
  getCategoryByIdService,
  updateCategoryService,
  deleteCategoryService
} from '../services/category.service.js'

export const createCategory = async (req, res) => {
  try {
    const category = await createCategoryService(req.body)
    res.status(201).json({ message: 'Categoría creada correctamente', category })
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Error al crear categoría' })
  }
}

export const listCategories = async (req, res) => {
  try {
    const data = await listCategoriesService(req.query)
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener categorías', error: error.message })
  }
}

export const listCategoryById = async (req, res) => {
  try {
    const category = await getCategoryByIdService(req.params.id)
    res.json(category)
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Error al obtener categoría' })
  }
}

export const updateCategory = async (req, res) => {
  try {
    const category = await updateCategoryService(req.params.id, req.body)
    res.json({ message: 'Categoría actualizada correctamente', category })
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Error al actualizar categoría' })
  }
}

export const deleteCategory = async (req, res) => {
  try {
    const result = await deleteCategoryService(req.params.id)
    res.json(result)
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Error al eliminar categoría' })
  }
}
