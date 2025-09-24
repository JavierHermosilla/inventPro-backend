'use strict'

const schema = process.env.DB_SCHEMA || 'public'

module.exports = {
  async up (queryInterface, Sequelize) {
    // crea esquema si no existe
    if (queryInterface.createSchema) {
      await queryInterface.createSchema(schema).catch(() => {})
    }

    await queryInterface.createTable(
      { tableName: 'users', schema },
      {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.literal('gen_random_uuid()'),
          primaryKey: true
        },
        name: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        email: {
          type: Sequelize.STRING(150),
          allowNull: false,
          unique: true
        },
        password_hash: {
          type: Sequelize.STRING(200),
          allowNull: false
        },
        role: {
          type: Sequelize.ENUM('user', 'admin'),
          allowNull: false,
          defaultValue: 'user'
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }
    )
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable({ tableName: 'users', schema })
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";')
  }
}
