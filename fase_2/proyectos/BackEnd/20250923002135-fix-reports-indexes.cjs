'use strict'

module.exports = {
  async up (queryInterface) {
    const table = { schema: 'inventpro_user', tableName: 'reports' }

    const addIndexSafe = async (fields, name, opts = {}) => {
      try { await queryInterface.addIndex(table, fields, { name, ...opts }) } catch (e) {}
    }

    await addIndexSafe(['created_by'], 'reports_created_by')
    await addIndexSafe(['status'], 'reports_status')
    await addIndexSafe(['format'], 'reports_format')
    await addIndexSafe(['created_at'], 'reports_created_at')

    // FK a users.id
    try {
      await queryInterface.addConstraint(table, {
        fields: ['created_by'],
        type: 'foreign key',
        name: 'reports_created_by_fkey',
        references: { table: { schema: 'inventpro_user', tableName: 'users' }, field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      })
    } catch (e) {}
  },

  async down (queryInterface) {
    const table = { schema: 'inventpro_user', tableName: 'reports' }
    try { await queryInterface.removeConstraint(table, 'reports_created_by_fkey') } catch (e) {}
    try { await queryInterface.removeIndex(table, 'reports_created_by') } catch (e) {}
    try { await queryInterface.removeIndex(table, 'reports_status') } catch (e) {}
    try { await queryInterface.removeIndex(table, 'reports_format') } catch (e) {}
    try { await queryInterface.removeIndex(table, 'reports_created_at') } catch (e) {}
  }
}
