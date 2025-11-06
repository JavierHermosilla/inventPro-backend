'use strict'

/** Asegura unicidad (order_id, product_id) + índices de apoyo */
module.exports = {
  async up (qi) {
    const t = await qi.sequelize.transaction()
    const schema = 'inventpro_user' // o process.env.DB_SCHEMA

    try {
      // 0) Pre-check: abortar si existen combinaciones duplicadas (order_id, product_id)
      await qi.sequelize.query(`
        DO $$
        DECLARE v_cnt int;
        BEGIN
          SELECT count(*) INTO v_cnt
          FROM (
            SELECT order_id, product_id
            FROM "${schema}"."order_products"
            GROUP BY order_id, product_id
            HAVING COUNT(*) > 1
          ) d;
          IF v_cnt > 0 THEN
            RAISE EXCEPTION 'No se puede crear índice único: existen % combinaciones duplicadas de (order_id, product_id). Limpia o consolida antes de migrar.', v_cnt;
          END IF;
        END
        $$;
      `, { transaction: t })

      // 1) Índice único (order_id, product_id)
      await qi.sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_indexes
            WHERE schemaname='${schema}'
              AND indexname='order_products_order_id_product_id_uq'
          ) THEN
            CREATE UNIQUE INDEX order_products_order_id_product_id_uq
            ON "${schema}"."order_products" ("order_id","product_id");
          END IF;
        END
        $$;
      `, { transaction: t })

      // 2) Índices de apoyo para joins y filtros
      await qi.sequelize.query(`
        CREATE INDEX IF NOT EXISTS order_products_order_id_idx
        ON "${schema}"."order_products" ("order_id");
      `, { transaction: t })

      await qi.sequelize.query(`
        CREATE INDEX IF NOT EXISTS order_products_product_id_idx
        ON "${schema}"."order_products" ("product_id");
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
        DROP INDEX IF EXISTS "${schema}".order_products_order_id_product_id_uq;
        DROP INDEX IF EXISTS "${schema}".order_products_order_id_idx;
        DROP INDEX IF EXISTS "${schema}".order_products_product_id_idx;
      `, { transaction: t })
      await t.commit()
    } catch (e) {
      await t.rollback()
      throw e
    }
  }
}
