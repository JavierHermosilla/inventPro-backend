"use strict";

module.exports = {
  async up (qi) {
    const t = await qi.sequelize.transaction();
    const schema = "inventpro_user";
    try {
      // --- Limpieza de UNIQUE sobre clients.rut (dejar solo el único PARCIAL clients_rut_unique_active)
      await qi.sequelize.query(`
        DO $$
        DECLARE r record;
        BEGIN
          -- 1) Dropear TODOS los UNIQUE CONSTRAINTS de clients que apliquen exactamente a (rut)
          FOR r IN
            SELECT c.conname
            FROM pg_constraint c
            WHERE c.conrelid = '"${schema}"."clients"'::regclass
              AND c.contype = 'u'
              AND (
                SELECT array_agg(a.attname::text ORDER BY u.ord)
                FROM unnest(c.conkey) WITH ORDINALITY AS u(attnum, ord)
                JOIN pg_attribute a
                  ON a.attrelid = c.conrelid
                 AND a.attnum   = u.attnum
              ) = ARRAY['rut']::text[]
          LOOP
            EXECUTE format('ALTER TABLE "${schema}"."clients" DROP CONSTRAINT %I', r.conname);
          END LOOP;

          -- 2) Dropear el UNIQUE INDEX no-parcial sobre rut si existe (dejamos solo el parcial)
          IF EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname='${schema}' AND tablename='clients' AND indexname='clients_rut'
          ) THEN
            DROP INDEX "${schema}".clients_rut;
          END IF;

          -- 3) Asegurar el índice único PARCIAL canónico sobre rut
          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname='${schema}' AND tablename='clients' AND indexname='clients_rut_unique_active'
          ) THEN
            CREATE UNIQUE INDEX clients_rut_unique_active
            ON "${schema}"."clients" ("rut")
            WHERE deleted_at IS NULL;
          END IF;
        END
        $$;
      `, { transaction: t });

      // --- Limpieza de FKs duplicadas en orders.client_id -> clients.id (dejar solo orders_client_id_fkey con ON DELETE SET NULL)
      await qi.sequelize.query(`
        DO $$
        DECLARE r record;
        BEGIN
          -- 1) Borrar TODAS las FKs duplicadas excepto la canónica
          FOR r IN
            SELECT conname
            FROM pg_constraint c
            WHERE c.conrelid = '"${schema}"."orders"'::regclass
              AND c.contype  = 'f'
              AND c.confrelid = '"${schema}"."clients"'::regclass
              AND c.conname LIKE 'orders_client_id_fkey%'
              AND c.conname <> 'orders_client_id_fkey'
          LOOP
            EXECUTE format('ALTER TABLE "${schema}"."orders" DROP CONSTRAINT %I', r.conname);
          END LOOP;

          -- 2) Si NO existe la canónica, crearla con ON UPDATE CASCADE ON DELETE SET NULL
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid='"${schema}"."orders"'::regclass
              AND conname='orders_client_id_fkey'
          ) THEN
            ALTER TABLE "${schema}"."orders"
            ADD CONSTRAINT orders_client_id_fkey
            FOREIGN KEY (client_id)
            REFERENCES "${schema}"."clients"(id)
            ON UPDATE CASCADE
            ON DELETE SET NULL;
          END IF;
        END
        $$;
      `, { transaction: t });

      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  },

  async down () {
    // No recreamos duplicados en rollback.
  }
};
