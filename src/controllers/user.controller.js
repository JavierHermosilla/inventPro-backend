import User from '../models/user.model.js'

export const listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password')
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: err.message })
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
  const { id } = req.params

  const { password, role, ...rest } = req.body

  try {
    const user = await User.findById(id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    // actualizamos los campos permitidos
    Object.assign(user, rest)

    await user.save()
    res.json({ message: 'User updated successfully', user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Error updating the user.' })
  }
}
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    const deleteUser = await User.findByIdAndDelete(id)

    if (!deleteUser) {
      return res.status(404).json({ message: 'User not found.' })
    }

    res.json({ message: 'User deleted successfully', user: deleteUser })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Error deleting the user.' })
  }
}
