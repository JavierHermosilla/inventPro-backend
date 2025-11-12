// scripts/seedAdmin.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Op } from 'sequelize'
import { sequelize, models } from '../src/models/index.js' // 👈 ruta buena

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const localEnvPath = path.resolve(__dirname, '../src/.env')

if (process.env.SKIP_LOCAL_DOTENV !== '1' && fs.existsSync(localEnvPath)) {
  const { config } = await import('dotenv')
  config({ path: localEnvPath })
}
const { User } = models

async function main () {
  try {
    await sequelize.authenticate()

    const requiredEnv = ['ADMIN_USERNAME', 'ADMIN_NAME', 'ADMIN_EMAIL', 'ADMIN_PASSWORD']
    const missing = requiredEnv.filter(key => !String(process.env[key] || '').trim())
    if (missing.length) {
      console.error(`? Faltan variables de entorno obligatorias: ${missing.join(', ')}`)
      process.exit(1)
    }

    const username = String(process.env.ADMIN_USERNAME).trim()
    const name = String(process.env.ADMIN_NAME).trim()
    const email = String(process.env.ADMIN_EMAIL).trim().toLowerCase()
    const password = String(process.env.ADMIN_PASSWORD).trim()
    const role = 'admin'

    if (password.length < 12) {
      console.error('? ADMIN_PASSWORD debe tener al menos 12 caracteres')
      process.exit(1)
    }

    const complexityChecks = [
      { re: /[a-z]/, msg: 'una letra minúscula' },
      { re: /[A-Z]/, msg: 'una letra mayúscula' },
      { re: /\d/, msg: 'un número' },
      { re: /[^A-Za-z0-9]/, msg: 'un símbolo' }
    ]
    const missingComplexity = complexityChecks
      .filter(({ re }) => !re.test(password))
      .map(({ msg }) => msg)
    if (missingComplexity.length) {
      console.error(`? ADMIN_PASSWORD debe incluir: ${missingComplexity.join(', ')}`)
      process.exit(1)
    }

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
