import { Router } from 'express'
import { users, userById, updateUser, deleteUser } from '../controllers/user.controller.js'

const router = Router()

router.get('/', users)
router.get('/:id', userById)
router.put('/:id', updateUser)
router.delete('/:id', deleteUser)

export default router
