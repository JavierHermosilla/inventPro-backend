'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction()
    const schema = 'inventpro_user' // o process.env.DB_SCHEMA
    const table = { tableName: 'clients', schema }

    try {
      // 1) Agregar deleted_at SOLO si no existe
      const desc = await queryInterface.describeTable(table)
      if (!desc.deleted_at) {
        await queryInterface.addColumn(
          table,
          'deleted_at',
          { type: Sequelize.DATE, allowNull: true },
          { transaction: t }
        )
      }

      // 2) Extensión CITEXT
      await queryInterface.sequelize.query(
        'CREATE EXTENSION IF NOT EXISTS citext;',
        { transaction: t }
      )

      // 3) Cambiar email a CITEXT (si ya es CITEXT no falla; de todas formas lo hacemos schema-qualificado)
      await queryInterface.sequelize.query(
        'ALTER TABLE "inventpro_user"."clients" ALTER COLUMN "email" TYPE CITEXT;',
        { transaction: t }
      )

      // 4) Constraint de formato de RUT (solo si no existe)
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'clients_rut_format_chk'
              AND conrelid = '"inventpro_user"."clients"'::regclass
          ) THEN
            ALTER TABLE "inventpro_user"."clients"
            ADD CONSTRAINT "clients_rut_format_chk"
            CHECK (rut ~ '^[0-9]{7,8}-[0-9Kk]$');
          END IF;
        END
        $$;
      `, { transaction: t })

      // 5) Índices únicos parciales (solo si no existen)
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = 'clients_rut_unique_active'
              AND n.nspname = 'inventpro_user'
          ) THEN
            CREATE UNIQUE INDEX clients_rut_unique_active
            ON "inventpro_user"."clients" ("rut")
            WHERE deleted_at IS NULL;
          END IF;
        END
        $$;
      `, { transaction: t })

      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = 'clients_email_unique_active'
              AND n.nspname = 'inventpro_user'
          ) THEN
            CREATE UNIQUE INDEX clients_email_unique_active
            ON "inventpro_user"."clients" ("email")
            WHERE deleted_at IS NULL;
          END IF;
        END
        $$;
      `, { transaction: t })

      // 6) Índice de orden por fecha (idempotente)
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS clients_created_at_desc_idx
        ON "inventpro_user"."clients" ("created_at" DESC)
        WHERE deleted_at IS NULL;
      `, { transaction: t })

      await t.commit()
    } catch (err) {
      await t.rollback()
      throw err
    }
  },

  async down (queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.sequelize.query(
        'DROP INDEX IF EXISTS "inventpro_user"."clients_rut_unique_active";',
        { transaction: t }
      )
      await queryInterface.sequelize.query(
        'DROP INDEX IF EXISTS "inventpro_user"."clients_email_unique_active";',
        { transaction: t }
      )
      await queryInterface.sequelize.query(
        'DROP INDEX IF EXISTS "inventpro_user"."clients_created_at_desc_idx";',
        { transaction: t }
      )
      await queryInterface.sequelize.query(
        'ALTER TABLE "inventpro_user"."clients" DROP CONSTRAINT IF EXISTS "clients_rut_format_chk";',
        { transaction: t }
      )
      // (No borro la extensión citext ni la columna deleted_at en down para no romper otros objetos)
      await t.commit()
    } catch (err) {
      await t.rollback()
      throw err
    }
  }
}
