import app from './app.js'
import { connectDB } from './config/database.js'
import dotenv from 'dotenv'

dotenv.config()

const PORT = process.env.PORT || 3000

const startServer = async () => {
  try {
    await connectDB()
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log('JWT_SECRET:', process.env.JWT_SECRET) // para verificar que se carga bien
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}
startServer()
