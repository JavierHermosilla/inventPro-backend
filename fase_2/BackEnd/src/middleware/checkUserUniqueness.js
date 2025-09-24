import User from '../models/user.model.js'
import { Op } from 'sequelize'

export const checkUserUniqueness = async (req, res, next) => {
  try {
    const { email, username } = req.body
    const userId = req.params.id

    if (email) {
      const existingEmail = await User.findOne({
        where: {
          email,
          id: { [Op.ne]: userId }
        }
      })
      if (existingEmail) {
        return res.status(400).json({ message: 'El email ya está registrado' })
      }
    }

    if (username) {
      const existingUsername = await User.findOne({
        where: {
          username,
          id: { [Op.ne]: userId }
        }
      })
      if (existingUsername) {
        return res.status(400).json({ message: 'El nombre de usuario ya está en uso' })
      }
    }

    next()
  } catch (err) {
    next(err)
  }
}
