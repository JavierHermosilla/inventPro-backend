// import app from './app.js'
// import { connectDB } from './config/db.js'

// connectDB()
// const PORT = process.env.PORT ?? 3000

// app.listen(PORT, () => {
//   console.log(`server listening on port http://localhost:${PORT}`)
// })
import mongoose from 'mongoose'
import app from './app.js'

const MONGODB_URI = 'mongodb://127.0.0.1:27017/inventPro' // o el nombre de tu BD

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('🟢 Conectado a MongoDB')
    app.listen(3000, () => console.log('🚀 Servidor en http://localhost:3000'))
  })
  .catch(err => console.error('❌ Error de conexión a MongoDB:', err))
