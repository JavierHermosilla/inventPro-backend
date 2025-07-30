export const checkRole = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: user not found in request' })
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied: insufficient permissions' })
      }

      next()
    } catch (err) {
      return res.status(500).json({ message: err.message })
    }
  }
}
