// src/test/setup.js
import mongoose, { Types } from 'mongoose'
import dotenv from 'dotenv'
import { MongoMemoryServer } from 'mongodb-memory-server'

import User from '../models/user.model.js'
import Category from '../models/category.model.js'
import Supplier from '../models/supplier.model.js'
import Product from '../models/product.model.js'

dotenv.config({ path: '.env.test' })

let mongoServer

// IDs exportables fijos
export let adminId, normalUserId, product1Id, product2Id

// Conectar MongoMemoryServer
export const connectDatabase = async () => {
  if (mongoose.connection.readyState === 0) {
    mongoServer = await MongoMemoryServer.create()
    const uri = mongoServer.getUri()
    if (!uri) throw new Error('MongoMemoryServer no proporcionó URI')
    await mongoose.connect(uri)
    console.log('✅ MongoDB conectado correctamente')
  }
}

// Cerrar MongoMemoryServer
export const closeDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
  }
  if (mongoServer) {
    await mongoServer.stop()
    mongoServer = null
  }
}

// Limpiar colecciones (excepto usuarios y productos si quieres mantener fijos)
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections
  for (const key of Object.keys(collections)) {
    if (['users', 'products'].includes(key)) continue
    await collections[key].deleteMany({})
  }
}

// Insertar datos base para tests
export const seedDatabase = async () => {
  // --- Usuarios ---
  let admin = await User.findOne({ email: 'admin@test.com' })
  if (!admin) {
    admin = await User.create({
      username: 'adminuser',
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'hashedpass',
      phone: '+56912345678',
      role: 'admin'
    })
  }

  let user = await User.findOne({ email: 'user@test.com' })
  if (!user) {
    user = await User.create({
      username: 'normaluser',
      name: 'Normal User',
      email: 'user@test.com',
      password: 'hashedpass',
      phone: '+56987654321',
      role: 'user'
    })
  }

  let bodeguero = await User.findOne({ email: 'bodeguero@test.com' })
  if (!bodeguero) {
    bodeguero = await User.create({
      username: 'bodeguero',
      name: 'Bodeguero User',
      email: 'bodeguero@test.com',
      password: 'hashedpass',
      phone: '+56911223344',
      role: 'bodeguero'
    })
  }

  adminId = admin._id
  normalUserId = user._id

  // --- Proveedor y Categoría ---
  let supplier = await Supplier.findOne({ name: 'Proveedor prueba' })
  if (!supplier) {
    supplier = await Supplier.create({ name: 'Proveedor prueba', rut: '12345678-9' })
  }

  let category = await Category.findOne({ name: 'Categoría prueba' })
  if (!category) {
    category = await Category.create({ name: 'Categoría prueba' })
  }

  // --- Productos ---
  product1Id = new Types.ObjectId()
  product2Id = new Types.ObjectId()

  // Eliminar posibles duplicados
  await Product.deleteMany({
    $or: [
      { _id: { $in: [product1Id, product2Id] } },
      { name: { $in: ['Producto1', 'Producto2'] } }
    ]
  })

  // Insertar productos
  await Product.create([
    {
      _id: product1Id,
      name: 'Producto1',
      stock: 10,
      price: 100,
      category: category._id,
      supplier: supplier._id
    },
    {
      _id: product2Id,
      name: 'Producto2',
      stock: 5,
      price: 50,
      category: category._id,
      supplier: supplier._id
    }
  ])
}

// --- Hooks de Jest ---
export const setupTests = async () => {
  await connectDatabase()
  await seedDatabase()
}

export const teardownTests = async () => {
  await closeDatabase()
}
