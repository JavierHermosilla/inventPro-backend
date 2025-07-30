import { Router } from 'express'
import {
  listUsers,
  userById,
  updateUser,
  deleteUser
} from '../controllers/user.controller.js'
import { verifyToken, requireRole } from '../middleware/auth.middleware.js'
import { checkRole } from '../middleware/role.middleware.js'
import { updateUserSchema } from '../schemas/auth.schema.js'
import { validateSchema } from '../middleware/validator.middleware.js'

const router = Router()

router.get('/', verifyToken, requireRole('admin'), listUsers)
router.get('/:id', verifyToken, requireRole('admin'), userById)
router.put('/:id', verifyToken, validateSchema(updateUserSchema), requireRole('admin'), updateUser)
router.delete('/:id', verifyToken, checkRole(['admin']), deleteUser)

export default router
