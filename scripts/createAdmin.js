import bcrypt from 'bcrypt'
import { sequelize, models, initializeModels } from '../src/models/index.js'

const createAdmin = async () => {
  try {
    // Conectar a la DB
    await sequelize.authenticate()
    console.log('✅ DB connected')

    // Inicializar modelos
    initializeModels()

    // Verificar si el admin ya existe
    const existingAdmin = await models.User.findOne({ where: { email: 'admin@example.com' } })

    if (existingAdmin) {
      console.log('⚠️ Admin ya existe:', existingAdmin.email)
      return
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash('Admin123!', 10)

    // Crear admin
    const admin = await models.User.create({
      username: 'admin',
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin'
    })

    console.log('✅ Admin creado:', {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role
    })

    process.exit(0)
  } catch (error) {
    console.error('❌ Error creando admin:', error)
    process.exit(1)
  }
}

// Ejecutar la función
createAdmin()
