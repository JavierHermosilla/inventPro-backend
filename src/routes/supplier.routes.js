import { Router } from 'express'
import { supplier, addsupplier, editsupplier, deletesupplier } from '../controllers/supplier.controller.js'

const router = Router()

router.get('/', supplier) // listar productos
router.post('/', addsupplier) // producto por id
router.put('/:id', editsupplier) // crear producto
router.delete('/:id', deletesupplier) // eliminar producto

export default router
