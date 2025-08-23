import { Sequelize } from 'sequelize'
import {
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT
} from './env.js'

export const sequelize = new Sequelize(
  DB_NAME,
  DB_USER,
  DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    logging: false // Disable logging for cleaner output
  })

export const connectDB = async () => {
  try {
    await sequelize.authenticate()
    console.log('>>> PostgreSQL connected successfully!')
  } catch (err) {
    console.error('Unable to connect to the database:', err)
    process.exit(1) // Exit the process if connection fails
  }
}
