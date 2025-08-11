import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

let mongoServer

export const connect = async () => {
  console.log('✅ setup.js ejecutado')
  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()

  if (!uri) {
    throw new Error('MongoMemoryServer did not provide a URI')
  }

  await mongoose.connect(uri)
  console.log('✅ MongoDB conectado correctamente')
}

export const closeDatabase = async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
  await mongoServer.stop()
}

export const clearDatabase = async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
}
