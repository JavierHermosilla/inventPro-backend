import User from '../models/user.model.js'

export const checkRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.userId)
      if (!user) return res.status(404).json({ message: 'User not found' })

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: 'Access denied: insufficient permissions' })
      }

      next()
    } catch (err) {
      return res.status(500).json({ message: err.message })
    }
  }
}
