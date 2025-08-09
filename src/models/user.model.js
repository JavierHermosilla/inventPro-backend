import { ROLES } from '../config/roles.js'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    match: /^\S+@\S+\.\S+$/
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    match: /^[0-9+()\-\s]+$/
  },
  address: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    trim: true,
    default: ''
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.USER
  }

}, {
  timestamps: true
})

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)

    next()
  } catch (err) {
    next(err)
  }
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

export default mongoose.model('User', userSchema)
