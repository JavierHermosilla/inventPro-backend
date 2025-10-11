'use strict'

module.exports = {
  async up (queryInterface) {
    const table = { schema: 'inventpro_user', tableName: 'manual_inventories' }

    const addIndexSafe = async (fields, name, opts = {}) => {
      try { await queryInterface.addIndex(table, fields, { name, ...opts }) } catch (e) {}
    }
    await addIndexSafe(['product_id'], 'manual_inventories_product_id')
    await addIndexSafe(['user_id'], 'manual_inventories_user_id')
    await addIndexSafe(['type'], 'manual_inventories_type')
    await addIndexSafe(['created_at'], 'manual_inventories_created_at')

    // FKs
    try {
      await queryInterface.addConstraint(table, {
        fields: ['product_id'],
        type: 'foreign key',
        name: 'manual_inventories_product_id_fkey',
        references: { table: { schema: 'inventpro_user', tableName: 'products' }, field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      })
    } catch (e) {}
    try {
      await queryInterface.addConstraint(table, {
        fields: ['user_id'],
        type: 'foreign key',
        name: 'manual_inventories_user_id_fkey',
        references: { table: { schema: 'inventpro_user', tableName: 'users' }, field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      })
    } catch (e) {}
  },

  async down (queryInterface) {
    const table = { schema: 'inventpro_user', tableName: 'manual_inventories' }
    try { await queryInterface.removeConstraint(table, 'manual_inventories_product_id_fkey') } catch (e) {}
    try { await queryInterface.removeConstraint(table, 'manual_inventories_user_id_fkey') } catch (e) {}
    try { await queryInterface.removeIndex(table, 'manual_inventories_product_id') } catch (e) {}
    try { await queryInterface.removeIndex(table, 'manual_inventories_user_id') } catch (e) {}
    try { await queryInterface.removeIndex(table, 'manual_inventories_type') } catch (e) {}
    try { await queryInterface.removeIndex(table, 'manual_inventories_created_at') } catch (e) {}
  }
}
