import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    console.log('>>> MongoDB connected successfully.DB is connected')
  } catch (err) {
    console.log('Error connecting to MongoDB:', err.message)
    process.exit(1)
  }
}
