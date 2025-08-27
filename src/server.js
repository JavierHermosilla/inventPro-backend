import dotenv from 'dotenv'
import app from './app.js'
import { sequelize, initializeModels } from './models/index.js'

dotenv.config()
const PORT = process.env.PORT || 3000

const startServer = async () => {
  try {
    // 🔹 Inicializa modelos y relaciones
    initializeModels()

    // Conexión a PostgreSQL
    await sequelize.authenticate()
    console.log('✅ PostgreSQL connected successfully!')

    // Sincronización de tablas
    await sequelize.sync({ alter: true })

    // Inicia el servidor
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
    })
  } catch (err) {
    console.error('❌ Failed to start server:', err)
    process.exit(1)
  }
}

startServer()
