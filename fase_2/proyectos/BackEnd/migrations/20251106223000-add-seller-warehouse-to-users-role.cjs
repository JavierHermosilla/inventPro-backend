'use strict'

module.exports = {
  async up (qi) {
    const schema = process.env.DB_SCHEMA || 'inventpro_user'
    // Agrega los valores si no existen (seguro para repetir)
    const sql = `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON e.enumtypid = t.oid
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'enum_users_role'
          AND n.nspname = '${schema}'
          AND e.enumlabel = 'seller'
      ) THEN
        ALTER TYPE "${schema}"."enum_users_role" ADD VALUE 'seller';
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON e.enumtypid = t.oid
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'enum_users_role'
          AND n.nspname = '${schema}'
          AND e.enumlabel = 'warehouse'
      ) THEN
        ALTER TYPE "${schema}"."enum_users_role" ADD VALUE 'warehouse';
      END IF;
    END$$;
    `
    await qi.sequelize.query(sql)
  },

  async down (qi) {
    // ⚠️ Postgres no soporta DROP VALUE en ENUM de forma nativa (sin recrear el tipo).
    // Dejamos el down vacío por seguridad.
  }
}
