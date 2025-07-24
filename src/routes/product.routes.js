import { Router } from 'express'
import { products, productById, createProduct, updateProduct, deleteProduct } from '../controllers/product.controller.js'

const router = Router()

router.get('/', products) // listar productos
router.get('/:id', productById) // producto por id
router.post('/', createProduct) // crear producto
router.put('/:id', updateProduct) // actualizar producto
router.delete('/:id', deleteProduct) // eliminar producto

export default router
