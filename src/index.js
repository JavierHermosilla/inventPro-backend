import mongoose from 'mongoose'
import app from './app.js'
import dotenv from 'dotenv'

dotenv.config()

const PORT = process.env.PORT || 3000
const MONGODB_URI = 'mongodb://127.0.0.1:27017/inventPro'
console.log('JWT_SECRET en index.js:', process.env.JWT_SECRET)

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('🟢 Conectado a MongoDB')
    app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`))
  })
  .catch(err => {
    console.error('❌ Error de conexión a MongoDB:', err)
    process.exit(1)
  })
