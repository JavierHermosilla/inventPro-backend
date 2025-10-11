import 'dotenv/config'
import { Sequelize } from 'sequelize'
import { createRequire } from 'module'
import Client from '../src/models/client.model.js'

const require = createRequire(import.meta.url)
const cfg = require('../config/config.cjs')
const env = 'development'

const sequelize = new Sequelize(
  cfg[env].database,
  cfg[env].username,
  cfg[env].password,
  {
    host: cfg[env].host,
    port: cfg[env].port,
    dialect: 'postgres',
    logging: console.log,
    searchPath: cfg[env].schema || 'inventpro_user',
    define: { schema: cfg[env].schema || 'inventpro_user', underscored: true }
  }
)

function log (title, ok = true, extra = '') {
  const prefix = ok ? '✔' : '✘'
  console.log(`${prefix} ${title}${extra ? ' — ' + extra : ''}`)
}

// Ejecuta fn dentro de un SAVEPOINT (transacción anidada)
// Si falla con 23505 (unique violation), lo consideramos "OK" para la prueba
async function expectUniqueViolation (t, fn, label) {
  try {
    await sequelize.transaction({ transaction: t }, async (sp) => {
      await fn(sp)
    })
    log(label, false, 'NO falló y debía fallar')
    throw new Error('Se esperaba violación única (23505) y no ocurrió')
  } catch (err) {
    const code = err?.original?.code || err?.parent?.code || err?.code
    if (code === '23505') {
      log(`${label}: OK`)
      return
    }
    throw err
  }
}

async function run () {
  await sequelize.authenticate()
  Client.initialize(sequelize)

  const t = await sequelize.transaction()
  try {
    // --- A) EMAIL único parcial ---
    const A = await Client.create({
      name: 'Email A',
      rut: '11111111-1',
      address: 'Dir 1',
      phone: '+56 9 1111 1111',
      email: 'dup@example.com'
    }, { transaction: t })
    log('Creó Email A (dup@example.com)')

    // Debe FALLAR por duplicado activo (savepoint)
    await expectUniqueViolation(
      t,
      (sp) => Client.create({
        name: 'Email B',
        rut: '22222222-2',
        address: 'Dir 2',
        phone: '+56 9 2222 2222',
        email: 'dup@example.com'
      }, { transaction: sp }),
      'Bloqueo email duplicado (activo)'
    )

    // Soft delete de A (ahora sí funciona porque el savepoint no aborta 't')
    await A.destroy({ transaction: t })
    log('Soft delete Email A')

    // Debe OK (email vuelve a estar libre)
    await Client.create({
      name: 'Email C',
      rut: '33333333-3',
      address: 'Dir 3',
      phone: '+56 9 3333 3333',
      email: 'dup@example.com'
    }, { transaction: t })
    log('Insert con mismo email tras soft delete: OK')

    // Case-insensitive (CITEXT): Debe chocar con dup@example.com (savepoint)
    await expectUniqueViolation(
      t,
      (sp) => Client.create({
        name: 'Email D',
        rut: '33333334-1',
        address: 'Dir 4',
        phone: '+56 9 4444 4444',
        email: 'Dup@Example.com'
      }, { transaction: sp }),
      'Bloqueo case-insensitive email'
    )

    // --- B) RUT único parcial ---
    const RUTA = await Client.create({
      name: 'RUT A',
      rut: '44444444-4',
      address: 'Dir 4',
      phone: '+56 9 4444 4444',
      email: 'rut-a@example.com'
    }, { transaction: t })
    log('Creó RUT A (44444444-4)')

    // Debe FALLAR por duplicado activo (savepoint)
    await expectUniqueViolation(
      t,
      (sp) => Client.create({
        name: 'RUT B',
        rut: '44444444-4',
        address: 'Dir 5',
        phone: '+56 9 5555 5555',
        email: 'rut-b@example.com'
      }, { transaction: sp }),
      'Bloqueo RUT duplicado (activo)'
    )

    // Soft delete y reutilización
    await RUTA.destroy({ transaction: t })
    log('Soft delete RUT A')

    await Client.create({
      name: 'RUT C',
      rut: '44444444-4',
      address: 'Dir 6',
      phone: '+56 9 6666 6666',
      email: 'rut-c@example.com'
    }, { transaction: t })
    log('Insert con mismo RUT tras soft delete: OK')

    // --- C) Validación DV RUT (modelo) ---
    // Esto es validación de Sequelize (no SQL unique), así que no necesitamos savepoint
    try {
      await Client.create({
        name: 'DV Malo',
        rut: '12345678-9', // DV incorrecto (para 12345678 el DV correcto es 5)
        address: 'Dir X',
        phone: '+56 9 7777 7777',
        email: 'dv-bad@example.com'
      }, { transaction: t })
      log('Validación DV RUT', false, 'NO falló y debía fallar')
      throw new Error('Debe fallar por DV inválido')
    } catch (err) {
      if (err?.errors?.some(e => /dígito verificador/i.test(e.message))) {
        log('Validación DV RUT: OK')
      } else {
        throw err
      }
    }

    // No dejamos basura
    await t.rollback()
    log('Rollback de prueba (BD limpia)')
  } catch (e) {
    try { await t.rollback() } catch {}
    console.error('✘ Error en prueba:', e)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

run()
