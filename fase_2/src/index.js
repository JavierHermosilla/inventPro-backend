// // config/database.js
// import { Sequelize } from 'sequelize'

// export const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASSWORD,
//   {
//     host: process.env.DB_HOST,
//     dialect: 'postgres',
//     logging: false
//   }
// )

// export const connectDB = async () => {
//   try {
//     await sequelize.authenticate()
//     console.log('PostgreSQL connected successfully')
//     await sequelize.sync({ alter: true }) // ajusta tablas automáticamente
//   } catch (error) {
//     console.error('Unable to connect to PostgreSQL:', error)
//     throw error
//   }
// }
