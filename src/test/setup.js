import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.test' })

let mongoServer

export const connect = async () => {
  if (mongoose.connection.readyState === 0) { // 0 = disconnected
    console.log('✅ setup.js ejecutado')
    mongoServer = await MongoMemoryServer.create()
    const uri = mongoServer.getUri()

    if (!uri) {
      throw new Error('MongoMemoryServer no proporcionó URI')
    }

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    console.log('✅ MongoDB conectado correctamente')
  }
}

export const closeDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
  }
  if (mongoServer) {
    await mongoServer.stop()
  }
}

export const clearDatabase = async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
}

// Hooks globales para llamar desde jest.setup.js o tests
export const setupTests = async () => {
  await connect()
}

export const teardownTests = async () => {
  await closeDatabase()
}
