'use strict'

const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')

module.exports = {
  async up (qi) {
    const t = await qi.sequelize.transaction()
    const schema = process.env.DB_SCHEMA || 'inventpro_user'
    try {
      const now = new Date()

      const [sellerHash, whHash] = await Promise.all([
        bcrypt.hash(process.env.SEED_SELLER_PASS || 'Vendedor123!', 10),
        bcrypt.hash(process.env.SEED_WAREHOUSE_PASS || 'Bodeguero123!', 10)
      ])

      // Limpia por email para evitar UNIQUE conflicts
      await qi.bulkDelete(
        { tableName: 'users', schema },
        { email: ['seller@inventpro.cl', 'warehouse@inventpro.cl'] },
        { transaction: t }
      )

      // Inserta SOLO columnas seguras y mapea roles al ENUM real
      await qi.bulkInsert({ tableName: 'users', schema }, [
        {
          id: uuidv4(),
          name: 'Vendedor Demo',
          email: 'seller@inventpro.cl',
          password: sellerHash,
          role: 'seller',
          created_at: now,
          updated_at: now
        },
        {
          id: uuidv4(),
          name: 'Bodeguero Demo',
          email: 'warehouse@inventpro.cl',
          password: whHash,
          role: 'warehouse',
          created_at: now,
          updated_at: now
        }
      ], { transaction: t })

      await t.commit()
    } catch (e) {
      await t.rollback()
      throw e
    }
  },

  async down (qi) {
    const t = await qi.sequelize.transaction()
    const schema = process.env.DB_SCHEMA || 'inventpro_user'
    try {
      await qi.bulkDelete(
        { tableName: 'users', schema },
        { email: ['seller@inventpro.cl', 'warehouse@inventpro.cl'] },
        { transaction: t }
      )
      await t.commit()
    } catch (e) {
      await t.rollback()
      throw e
    }
  }
}
