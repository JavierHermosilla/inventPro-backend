'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (qi, Sequelize) {
    const t = await qi.sequelize.transaction()
    const schema = 'inventpro_user' // o process.env.DB_SCHEMA
    try {
      // Agrega la columna solo si NO existe, con DEFAULT 0 y NOT NULL en un único ALTER
      await qi.sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = '${schema}'
              AND table_name   = 'order_products'
              AND column_name  = 'price'
          ) THEN
            ALTER TABLE "${schema}"."order_products"
            ADD COLUMN "price" NUMERIC(10,2) NOT NULL DEFAULT 0;
          END IF;
        END
        $$;
      `, { transaction: t })

      await t.commit()
    } catch (e) {
      await t.rollback()
      throw e
    }
  },

  async down (qi) {
    const t = await qi.sequelize.transaction()
    const schema = 'inventpro_user'
    try {
      await qi.sequelize.query(
        `ALTER TABLE "${schema}"."order_products" DROP COLUMN IF EXISTS "price";`,
        { transaction: t }
      )
      await t.commit()
    } catch (e) {
      await t.rollback()
      throw e
    }
  }
}
