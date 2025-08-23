import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

const sequelize = new Sequelize(
  process.env.DB_NAME || 'inventpro',
  process.env.DB_USER || 'inventpro_user',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
)

export const connectDB = async () => {
  try {
    await sequelize.authenticate()
    console.log('>>> PostgreSQL connected successfully!')
  } catch (error) {
    console.error('Unable to connect to the database:', error)
    process.exit(1)
  }
}

export default sequelize
