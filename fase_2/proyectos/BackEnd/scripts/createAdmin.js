// scripts/createAdmin.js
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { sequelize } from '../src/db/db.js'
import User from '../src/models/user.model.js'
import { signAccessToken } from '../src/libs/jwt.js'
import { Op } from 'sequelize'

const DEFAULT_EMAIL = 'admin@inventpro.cl'
const DEFAULT_USERNAME = 'admin'
const DEFAULT_PASSWORD = 'Admin123!'
const role = 'admin'

const emailArg = process.argv[2]
const passArg = process.argv[3]

const createAdmin = async () => {
  try {
    await sequelize.authenticate()
    console.log('✅ DB connected')

    // --- Caso 1: admin global fijo ---
    let globalAdmin = await User.findOne({
      where: { [Op.or]: [{ email: DEFAULT_EMAIL }, { username: DEFAULT_USERNAME }] }
    })

    if (!globalAdmin) {
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)
      globalAdmin = await User.create({
        username: DEFAULT_USERNAME,
        name: 'Super Admin',
        email: DEFAULT_EMAIL,
        password: hashedPassword,
        role
      })
      console.log(`✅ Admin global creado: ${DEFAULT_EMAIL}`)
    } else {
      console.log(`ℹ️ Admin global ya existe: ${globalAdmin.email}`)
    }

    // --- Caso 2: crear admin adicional (si pasan argumentos) ---
    if (emailArg) {
      const baseUsername = emailArg.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
      let user = await User.findOne({ where: { email: emailArg } })

      if (!user) {
        const hashedPassword = await bcrypt.hash(passArg || DEFAULT_PASSWORD, 10)
        user = await User.create({
          username: baseUsername,
          name: 'Admin Extra',
          email: emailArg,
          password: hashedPassword,
          role
        })
        console.log(`✅ Admin adicional creado: ${emailArg}`)
      } else {
        console.log(`⚠️ Admin adicional ya existe: ${emailArg}`)
      }

      const tokenExtra = await signAccessToken({ id: user.id, role: user.role })
      console.log('\n🔑 JWT admin adicional:\n', tokenExtra)
    }

    // Siempre imprime token del admin global
    const tokenGlobal = await signAccessToken({ id: globalAdmin.id, role: globalAdmin.role })
    console.log('\n🔑 JWT admin global:\n', tokenGlobal)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error creando admin:', error)
    process.exit(1)
  }
}

createAdmin()
