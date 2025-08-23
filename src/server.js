import app from './app.js'
import { connectDB } from './config/db.js'
import { PORT, JWT_SECRET } from './config/env.js'

const startServer = async () => {
  try {
    await connectDB()
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log('JWT_SECRET:', JWT_SECRET) // para verificar que se carga bien
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

startServer()
