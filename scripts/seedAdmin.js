// scripts/seedAdmin.js
import 'dotenv/config'
import { Op } from 'sequelize'
import { sequelize, models } from '../src/models/index.js' // 👈 ruta buena
const { User } = models

async function main () {
  try {
    await sequelize.authenticate()

    const username = process.env.ADMIN_USERNAME || 'admin'
    const name = process.env.ADMIN_NAME || 'Administrador'
    const email = process.env.ADMIN_EMAIL || 'admin@inventpro.cl'
    const password = process.env.ADMIN_PASSWORD || 'Admin123!' // 8+ chars
    const role = 'admin'

    // Evita duplicados por username o email
    const existing = await User.findOne({
      where: { [Op.or]: [{ username }, { email }] }
    })
    if (existing) {
      console.log(`✅ Admin ya existe → ${existing.username} <${existing.email}>`)
      return
    }

    // ⚠️ IMPORTANTE:
    // Si tu modelo User tiene hooks beforeCreate/beforeUpdate para hashear,
    // basta con pasar password plano.
    await User.create({ username, name, email, password, role })

    console.log(`✅ Admin creado → ${username} <${email}>`)
  } catch (err) {
    console.error('❌ No se pudo crear admin:', err)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

main()
