// server.js
import dotenv from 'dotenv'
import app from './app.js'
import { sequelize/*, models */ } from './db/db.js'

dotenv.config()
const PORT = process.env.PORT || 3000

let server
;(async () => {
  try {
    await sequelize.authenticate()

    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true })
    } else {
      // En prod: usa migraciones (sequelize-cli) y NO sync.
      console.log('✅ DB authenticated. Skipping sync in production.')
    }

    server = app.listen(PORT, () => {
      console.log('>>> PostgreSQL connected successfully!')
      console.log(`✅ Server running on port 127.0.0.1:${PORT}`)
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
