import User from '../models/user.model.js'
import pick from 'lodash/pick.js'

export const listUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const search = req.query.search || ''
    const roleFilter = req.query.role

    // Construir filtro dinamico
    const filter = {}

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ]
    }

    if (roleFilter) {
      filter.role = roleFilter
    }

    const total = await User.countDocuments(filter)

    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })// los mas recientes primero

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      users
    })
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user.', error: err.message })
  }
}
export const userById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
export const updateUser = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin'
    // actualizan campos no password ni rol
    const allowedFields = isAdmin
      ? ['username', 'name', 'email', 'phone', 'address', 'avatar', 'role']
      : ['username', 'name', 'email', 'phone', 'address', 'avatar']

    const dataToUpdate = pick(req.body, allowedFields)

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      dataToUpdate,
      { new: true, runValidators: true }
    ).select('-password')

    if (!updatedUser) return res.status(404).json({ message: 'User not found' })

    res.json({ message: 'User updated successfully', user: updatedUser })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Error updating the user.', error: err.message })
  }
}
export const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id)

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found.' })
    }

    res.json({ message: 'User deleted successfully', user: deletedUser })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Error deleting the user.', error: err.message })
  }
}
