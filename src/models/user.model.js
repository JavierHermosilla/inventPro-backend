import { ROLES } from '../config/roles.js'
import mongoose from 'mongoose'

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
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
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

export default mongoose.model('User', userSchema)
