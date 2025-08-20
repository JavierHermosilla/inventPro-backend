import mongoose from 'mongoose'

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    rut: {
      type: String,
      required: true,
      unique: true,
      match: /^[0-9]+-[0-9kK]{1}$/
    },
    address: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    avatar: {
      type: String,
      trim: true,
      default: null
    }

  },
  { timestamps: true }
)

export default mongoose.model('Client', clientSchema)
