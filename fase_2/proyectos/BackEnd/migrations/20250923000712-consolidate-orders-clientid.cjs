'use strict'

module.exports = {
  async up (queryInterface, Sequelize) {
    const table = { schema: 'inventpro_user', tableName: 'orders' }

    // 1) Consolidar datos: si había customer_id, pasar a client_id
    await queryInterface.sequelize.query(`
      UPDATE "inventpro_user"."orders"
      SET client_id = COALESCE(client_id, customer_id)
      WHERE customer_id IS NOT NULL
    `)

    // 2) Asegurar que client_id es obligatorio
    await queryInterface.changeColumn(table, 'client_id', {
      type: Sequelize.UUID,
      allowNull: false
    })

    // 3) Eliminar la columna duplicada customer_id
    try {
      await queryInterface.removeColumn(table, 'customer_id')
    } catch (e) { /* ignorar si ya fue borrada */ }

    // 4) Índices
    const addIndexSafe = async (fields, name) => {
      try {
        await queryInterface.addIndex(table, fields, { name })
      } catch (e) {}
    }
    await addIndexSafe(['client_id'], 'orders_client_id')
    await addIndexSafe(['status'], 'orders_status')
    await addIndexSafe(['is_backorder'], 'orders_is_backorder')
    await addIndexSafe(['created_at'], 'orders_created_at')

    // 5) FK a clients.id (ajusta si tu tabla clientes tiene otro nombre)
    try {
      await queryInterface.addConstraint(table, {
        fields: ['client_id'],
        type: 'foreign key',
        name: 'orders_client_id_fkey',
        references: {
          table: { schema: 'inventpro_user', tableName: 'clients' },
          field: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      })
    } catch (e) {}
  },

  async down (queryInterface, Sequelize) {
    const table = { schema: 'inventpro_user', tableName: 'orders' }

    // Quitar FK e índices
    try { await queryInterface.removeConstraint(table, 'orders_client_id_fkey') } catch (e) {}
    try { await queryInterface.removeIndex(table, 'orders_client_id') } catch (e) {}
    try { await queryInterface.removeIndex(table, 'orders_status') } catch (e) {}
    try { await queryInterface.removeIndex(table, 'orders_is_backorder') } catch (e) {}
    try { await queryInterface.removeIndex(table, 'orders_created_at') } catch (e) {}

    // Restaurar columna customer_id
    await queryInterface.addColumn(table, 'customer_id', {
      type: Sequelize.UUID,
      allowNull: true
    })
  }
}
