// 🚀 src/server.js
import 'dotenv/config' // ← PRIMERO, side-effect import
import app from './app.js'
import { sequelize } from './db/db.js'

const PORT = process.env.PORT || 3000

let server
;(async () => {
  try {
    // Verifica conexión
    await sequelize.authenticate()

    // Solo en dev sincroniza
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true })
    } else {
      console.log('✅ DB authenticated. Skipping sync in production.')
    }

    server = app.listen(PORT, () => {
      console.log('>>> PostgreSQL connected successfully!')
      console.log(`✅ Server running on 127.0.0.1:${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
})()

const graceful = async (signal) => {
  console.log(`Received ${signal}. Closing...`)
  try {
    if (server) await new Promise(res => server.close(res))
    await sequelize.close()
    console.log('Closed gracefully.')
    process.exit(0)
  } catch (e) {
    console.error('Graceful shutdown error', e)
    process.exit(1)
  }
}
process.on('SIGINT', () => graceful('SIGINT'))
process.on('SIGTERM', () => graceful('SIGTERM'))
