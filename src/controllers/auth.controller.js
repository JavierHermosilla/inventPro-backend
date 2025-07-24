import User from '../models/user.model.js'
import bcrypt from 'bcryptjs'
import { createAccessToken } from '../libs/jwt.js'

export const register = async (req, res) => {
  const { username, name, email, password, phone, address, avatar, role } = req.body

  try {
    // remplazar con zod
    if (!username || !name || !email || !password) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' })
    }

    // restriccion de creacion de rol admin
    const allowedRoles = ['user', 'manager']
    const safeRole = allowedRoles.includes(role) ? role : 'user'

    // hash de contraseña
    const passwordhash = await bcrypt.hash(password, 10)

    const newUser = new User({
      username,
      name,
      email,
      password: passwordhash,
      phone,
      address,
      avatar,
      role: safeRole
    })

    const userSaved = await newUser.save()
    const token = await createAccessToken({ id: userSaved._id })

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })

    res.status(201).json({
      id: userSaved._id,
      username: userSaved.username,
      name: userSaved.name,
      email: userSaved.email,
      role: userSaved.role,
      phone: userSaved.phone,
      address: userSaved.address,
      avatar: userSaved.avatar,
      createdAt: userSaved.createdAt,
      updatedAt: userSaved.updatedAt
    })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}
export const login = async (req, res) => {
  const { email, password } = req.body

  try {
    const userFound = await User.findOne({ email })

    if (!userFound) {
      return res.status(400).json({ message: 'User not Found' })
    }
    // remplazar con zod
    if (!email || !password) {
      return res.status(400).json({ message: 'usuario o contraseña son incorrectos' })
    }

    // hash de contraseña
    const isMatch = await bcrypt.compare(password, userFound.password)

    if (!isMatch) return res.status(400).json({ message: 'usuario o contraseña son incorrectos' })

    const token = await createAccessToken({ id: userFound._id })

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })

    res.status(200).json({
      id: userFound._id,
      username: userFound.username,
      name: userFound.name,
      email: userFound.email,
      role: userFound.role,
      phone: userFound.phone,
      address: userFound.address,
      avatar: userFound.avatar,
      createdAt: userFound.createdAt,
      updatedAt: userFound.updatedAt
    })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}
export const profile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'user not found' })
    }

    res.json(user)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}
export const logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    expires: new Date(0)
  })

  return res.status(200).json({ message: 'sesión cerrada correctamente' })
}
