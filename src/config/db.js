import mongoose from 'mongoose'

export const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost/inventPro')
    console.log('>>> DB is connected')
  } catch (err) {
    console.log(err)
  }
}
