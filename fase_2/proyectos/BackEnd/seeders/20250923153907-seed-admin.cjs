'use strict'
const bcrypt = require('bcryptjs')

module.exports = {
  async up (queryInterface, Sequelize) {
    const schema = process.env.DB_SCHEMA || 'inventpro_user'
    const table = { tableName: 'users', schema }
    const now = Sequelize.fn('NOW')

    // Hash de 'Admin123!' (admite símbolos; login no pasa por Zod)
    const pass = await bcrypt.hash('Admin123!', 10)

    // ¿Existe ya el admin por email?
    const existingId = await queryInterface.rawSelect(
      table,
      { where: { email: 'admin@inventpro.cl' } },
      ['id']
    )

    if (existingId) {
      // Actualiza
      await queryInterface.bulkUpdate(
        table,
        { username: 'admin', name: 'Administrador', password: pass, role: 'admin', updated_at: now },
        { email: 'admin@inventpro.cl' }
      )
    } else {
      // Inserta
      await queryInterface.bulkInsert(
        table,
        [{
          // Descomenta si tu columna id NO tiene default uuid en la BD:
          // id: Sequelize.literal('gen_random_uuid()'),
          username: 'admin',
          name: 'Administrador',
          email: 'admin@inventpro.cl',
          password: pass,
          role: 'admin',
          created_at: now,
          updated_at: now
        }]
      )
    }
  },

  async down () {
    // en dev, no borramos al admin
  }
}
