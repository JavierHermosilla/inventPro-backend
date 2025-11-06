'use strict'

module.exports = {
  async up (qi) {
    const t = await qi.sequelize.transaction()
    const schema = 'inventpro_user'
    try {
      await qi.sequelize.query(`
        DO $$
        BEGIN
          -- 1) Eliminar duplicado 'uq_inv_order_products_order_id_product_id' (constraint o índice)
          IF EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'uq_inv_order_products_order_id_product_id'
              AND conrelid = '"${schema}"."order_products"'::regclass
          ) THEN
            ALTER TABLE "${schema}"."order_products"
            DROP CONSTRAINT "uq_inv_order_products_order_id_product_id";
          ELSIF EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname='${schema}'
              AND indexname='uq_inv_order_products_order_id_product_id'
          ) THEN
            DROP INDEX "${schema}".uq_inv_order_products_order_id_product_id;
          END IF;

          -- 2) Eliminar duplicado 'unique_order_product' (constraint o índice)
          IF EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'unique_order_product'
              AND conrelid = '"${schema}"."order_products"'::regclass
          ) THEN
            ALTER TABLE "${schema}"."order_products"
            DROP CONSTRAINT "unique_order_product";
          ELSIF EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname='${schema}'
              AND indexname='unique_order_product'
          ) THEN
            DROP INDEX "${schema}".unique_order_product;
          END IF;

          -- 3) Asegurar el índice canónico (no constraint) en (order_id, product_id)
          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname='${schema}'
              AND indexname='order_products_order_id_product_id_uq'
          ) THEN
            CREATE UNIQUE INDEX order_products_order_id_product_id_uq
            ON "${schema}"."order_products" ("order_id","product_id");
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
      await qi.sequelize.query(`
        DO $$
        BEGIN
          -- Restaurar los duplicados (solo para rollback; no recomendado en prod)
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'uq_inv_order_products_order_id_product_id'
              AND conrelid = '"${schema}"."order_products"'::regclass
          ) THEN
            ALTER TABLE "${schema}"."order_products"
            ADD CONSTRAINT "uq_inv_order_products_order_id_product_id"
            UNIQUE ("order_id","product_id");
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'unique_order_product'
              AND conrelid = '"${schema}"."order_products"'::regclass
          ) THEN
            ALTER TABLE "${schema}"."order_products"
            ADD CONSTRAINT "unique_order_product"
            UNIQUE ("order_id","product_id");
          END IF;
        END
        $$;
      `, { transaction: t })

      await t.commit()
    } catch (e) {
      await t.rollback()
      throw e
    }
  }
}
