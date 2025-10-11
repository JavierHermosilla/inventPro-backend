import { Router } from 'express'
import { createProduct, products, productById, updateProduct, deleteProduct } from '../controllers/product.controller.js'
import { validateSchema } from '../middleware/validator.middleware.js'
import { verifyTokenMiddleware, requireRole } from '../middleware/auth.middleware.js'
import { validateUUID } from '../middleware/validateUUID.middleware.js'
import { productSchema, productUpdateSchema } from '../schemas/product.schema.js'

const router = Router()

// Públicos
router.get('/', products)
router.get('/:id', validateUUID('id'), productById)

// A partir de acá: sólo admin
router.use(verifyTokenMiddleware, requireRole('admin'))

// Aplica validateUUID a todas las rutas con :id de aquí en adelante
router.use('/:id', validateUUID('id'))

router.post('/', validateSchema(productSchema), createProduct)
router.put('/:id', validateSchema(productUpdateSchema), updateProduct)
router.delete('/:id', deleteProduct)

export default router
