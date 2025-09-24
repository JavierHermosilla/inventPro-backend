'use strict'

const bcrypt = require('bcryptjs')

module.exports = {
  async up (queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash('Admin123!', 10)

    await queryInterface.bulkInsert(
      { schema: 'inventpro_user', tableName: 'users' },
      [{
        id: Sequelize.literal('gen_random_uuid()'), // usa pgcrypto
        username: 'admin',
        name: 'Administrador',
        email: 'admin@inventpro.cl',
        password: passwordHash, // tu columna es 'password'
        phone: null,
        address: null,
        avatar: null,
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      }],
      {}
    )
  },

  async down (queryInterface) {
    await queryInterface.bulkDelete(
      { schema: 'inventpro_user', tableName: 'users' },
      { email: 'admin@inventpro.cl' },
      {}
    )
  }
}
