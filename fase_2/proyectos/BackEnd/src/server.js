// 🚀 src/server.js
import 'dotenv/config' // Carga variables de entorno primero (side-effect)
import app from './app.js'
import { sequelize } from './db/db.js'
import { ensureAdminUser } from './db/adminBootstrap.js'

const PORT = Number(process.env.PORT) || 3000
// En contenedores (Railway/Vercel/etc.) debe escuchar en 0.0.0.0
const HOST = process.env.HOST || '0.0.0.0'

const DB_SYNC_MODE = (process.env.DB_SYNC || 'off').toLowerCase()

let server

async function bootstrap () {
  try {
    // Verifica conexión a la base
    await sequelize.authenticate()
    console.log('✅ DB authenticated.')

    if (DB_SYNC_MODE === 'safe') {
      console.log('ℹ️  Running sequelize.sync() (safe, no alter)...')
      await sequelize.sync()
      console.log('✅ DB sync safe completed.')
    } else if (DB_SYNC_MODE !== 'off') {
      console.warn(`⚠️  DB_SYNC="${process.env.DB_SYNC}" no es válido. Usa "safe" u "off". Continuando sin sync.`)
    } else {
      console.log('⏭️  Skipping sequelize.sync(). Use migrations to evolve schema.')
    }

    // Levanta el servidor HTTP
    server = app.listen(PORT, HOST, () => {
      console.log(`✅ Server running on http://${HOST}:${PORT}`)
      console.log(`🌱 NODE_ENV=${process.env.NODE_ENV || 'development'} • DB_SYNC=${DB_SYNC_MODE}`)
    })

    try {
      const created = await ensureAdminUser()
      if (created) {
        console.log('🔑 Usuario admin creado automáticamente (ADMIN_EMAIL / ADMIN_PASSWORD).')
      }
    } catch (e) {
      console.error('⚠️  No se pudo verificar/crear el admin inicial:', e.message)
    }

    // Maneja errores del servidor (p.ej., EADDRINUSE)
    server.on('error', (err) => {
      console.error('❌ HTTP server error:', err)
      process.exit(1)
    })
  } catch (err) {
    console.error('❌ Failed to start server:', err)
    process.exit(1)
  }
}

async function graceful (signal) {
  console.log(`↩️  Received ${signal}. Closing gracefully...`)
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve))
      console.log('🛑 HTTP server closed.')
    }
    await sequelize.close()
    console.log('🗄️  DB connection closed.')
    process.exit(0)
  } catch (e) {
    console.error('💥 Graceful shutdown error:', e)
    process.exit(1)
  }
}

// Errores no capturados
process.on('unhandledRejection', (reason) => {
  console.error('💥 UnhandledRejection:', reason)
})
process.on('uncaughtException', (err) => {
  console.error('💥 UncaughtException:', err)
  // Opcional: decide si terminar el proceso
})

// Señales del SO
process.on('SIGINT', () => graceful('SIGINT'))
process.on('SIGTERM', () => graceful('SIGTERM'))

// Arranque
bootstrap()
