"use strict";

module.exports = {
  async up (qi) {
    const t = await qi.sequelize.transaction();
    const schema = "inventpro_user";
    try {
      await qi.sequelize.query(`
        DO $$
        DECLARE r record;
        BEGIN
          -- === CLIENTS.EMAIL ===
          -- 1) Drop TODOS los UNIQUE CONSTRAINTS de clients(email) con nombre clients_email%
          FOR r IN
            SELECT conname
            FROM pg_constraint
            WHERE conrelid = '"${schema}"."clients"'::regclass
              AND contype = 'u'
              AND conname LIKE 'clients_email%'
          LOOP
            EXECUTE format('ALTER TABLE "${schema}"."clients" DROP CONSTRAINT %I', r.conname);
          END LOOP;

          -- 2) Drop TODOS los UNIQUE INDEXES de clients(email) con nombre clients_email%
          --    excepto el canónico parcial: clients_email_unique_active
          FOR r IN
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname='${schema}'
              AND tablename='clients'
              AND indexname LIKE 'clients_email%'
              AND indexname <> 'clients_email_unique_active'
          LOOP
            EXECUTE format('DROP INDEX "${schema}".%I', r.indexname);
          END LOOP;

          -- 3) Asegurar el índice único parcial canónico (por si no existiera)
          IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname='${schema}'
              AND tablename='clients'
              AND indexname='clients_email_unique_active'
          ) THEN
            CREATE UNIQUE INDEX clients_email_unique_active
            ON "${schema}"."clients" ("email")
            WHERE deleted_at IS NULL;
          END IF;

          -- === CATEGORIES.NAME ===
          -- Si existe el índice 'categories_name' y TAMBIÉN el constraint 'categories_name_key', borrar el índice duplicado
          IF EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname='${schema}' AND tablename='categories' AND indexname='categories_name'
          ) AND EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid='"${schema}"."categories"'::regclass AND conname='categories_name_key'
          ) THEN
            DROP INDEX "${schema}".categories_name;
          END IF;

          -- Si no hay ni índice ni constraint, crear el constraint único estándar
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid='"${schema}"."categories"'::regclass AND conname='categories_name_key'
          ) AND NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname='${schema}' AND tablename='categories' AND indexname='categories_name'
          ) THEN
            ALTER TABLE "${schema}"."categories"
            ADD CONSTRAINT "categories_name_key" UNIQUE ("name");
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

  async down (qi) {
    const t = await qi.sequelize.transaction();
    const schema = "inventpro_user";
    try {
      // No recreamos los duplicados en rollback.
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }
};
