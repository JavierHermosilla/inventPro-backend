import { Router } from 'express'
import {
  listUsers,
  userById,
  updateUser,
  deleteUser
} from '../controllers/user.controller.js'

import { verifyToken, requireRole, requireRoleOrSelf } from '../middleware/auth.middleware.js'
import { updateUserSchema } from '../schemas/auth.schema.js'
import { validateSchema } from '../middleware/validator.middleware.js'
import { validateObjectId } from '../middleware/validateObjectId.js'

const router = Router()

router.get('/', verifyToken, requireRole('admin'), listUsers)
router.get('/:id', verifyToken, requireRoleOrSelf('admin'), validateObjectId(), userById)
router.put(
  '/:id',
  verifyToken,
  requireRoleOrSelf('admin'),
  validateObjectId(),
  validateSchema(updateUserSchema),
  updateUser
)
router.delete('/:id', verifyToken, requireRoleOrSelf('admin'), validateObjectId(), deleteUser)

export default router
