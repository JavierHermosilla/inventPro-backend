import dotenv from 'dotenv'
import app from './app.js'
import { sequelize, models } from './db/db.js'

dotenv.config()
const PORT = process.env.PORT || 3000

;(async () => {
  try {
    await sequelize.authenticate()
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true })
    } else {
      await sequelize.sync() // o migraciones si las usas
    }
    app.listen(PORT, () => {
      console.log('>>> PostgreSQL connected successfully!')
      console.log(`✅ Server running on port 127.0.0.1:${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
})()
