import dotenv from 'dotenv'

// Carga variables de entorno, por defecto carga .env (o .env.test si configuras)
dotenv.config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env'
})

export const JWT_SECRET = process.env.JWT_SECRET
export const MONGODB_URI = process.env.MONGODB_URI
export const PORT = process.env.PORT || 3000
