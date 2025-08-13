import User from '../models/user.model.js'

export const checkUserUniqueness = async (req, res, next) => {
  try {
    const { email, username } = req.body
    const userId = req.params.id

    if (email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: userId } })
      if (existingEmail) {
        return res.status(400).json({ message: 'El email ya esta registrado' })
      }
    }

    if (username) {
      const existingUsername = await User.findOne({ username, _id: { $ne: userId } })
      if (existingUsername) {
        return res.status(400).json({ message: 'El nombre de usuario ya esta en uso' })
      }
    }

    next()
  } catch (err) {
    next(err)
  }
}
