import app from './app.js'
import { sequelize, initializeModels, models } from './models/index.js'
import dotenv from 'dotenv'

dotenv.config()
const PORT = process.env.PORT || 3000

const startServer = async () => {
  try {
    await sequelize.authenticate()
    console.log('>>> PostgreSQL connected successfully!')

    initializeModels()

    // Sincronizar primero tablas sin FKs problemáticas
    await models.User.sync({ force: true }) // elimina y crea
    await models.Category.sync({ force: true })
    await models.Supplier.sync({ force: true })
    await models.Product.sync({ force: true })
    await models.ManualInventory.sync({ force: true })
    await models.Order.sync({ force: true }) // la FK a User ya funcionará

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

startServer()
