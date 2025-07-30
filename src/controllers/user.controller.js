import mongoose from 'mongoose'
import User from '../models/user.model.js'
import pick from 'lodash/pick.js'

export const listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password')
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
export const userById = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid user ID. ' })
  }
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
export const updateUser = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'invalid user ID' })
  }
  try {
  // actualizan campos no password ni rol
    const allowedFields = [
      'username',
      'name',
      'email',
      'phone',
      'address',
      'avatar',
      'role'
    ]

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
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid user ID' })
  }
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
