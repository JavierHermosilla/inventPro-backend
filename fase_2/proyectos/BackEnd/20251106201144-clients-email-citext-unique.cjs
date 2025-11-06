'use strict'

module.exports = {
  async up (qi) {
    const schema = 'inventpro_user'

    // 1) Extensión citext (idempotente)
    await qi.sequelize.query('CREATE EXTENSION IF NOT EXISTS citext;')

    // 2) Normaliza email a minúsculas y cambia a CITEXT (fuera de TX para evitar bloquear índice CONCURRENTLY)
    await qi.sequelize.transaction(async t => {
      await qi.sequelize.query(`
        UPDATE "${schema}"."clients"
           SET email = LOWER(email)
         WHERE email IS NOT NULL;
      `, { transaction: t })

      await qi.sequelize.query(`
        ALTER TABLE "${schema}"."clients"
        ALTER COLUMN email TYPE CITEXT USING LOWER(email);
      `, { transaction: t })
    })

    // 3) Dedup: deja un solo activo por email (el más antiguo)
    await qi.sequelize.query(`
      WITH d AS (
        SELECT id, email,
               ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC, id ASC) rn
          FROM "${schema}"."clients"
         WHERE deleted_at IS NULL
      ),
      to_del AS (SELECT id FROM d WHERE rn > 1)
      UPDATE "${schema}"."clients" c
         SET deleted_at = NOW()
        FROM to_del t
       WHERE c.id = t.id;
    `)

    // 4) Índice único PARCIAL por email (solo activos). OJO: CONCURRENTLY no puede ir dentro de TX.
    await qi.sequelize.query(`
      CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS clients_email_unique_active
        ON "${schema}"."clients" (email)
       WHERE deleted_at IS NULL;
    `)
  },

  async down (qi) {
    const schema = 'inventpro_user'
    await qi.sequelize.query(`
      DROP INDEX CONCURRENTLY IF EXISTS "${schema}".clients_email_unique_active;
    `)

    // Opcional: volver a TEXT (no necesario en dev)
    // await qi.sequelize.query(`
    //   ALTER TABLE "${schema}"."clients"
    //   ALTER COLUMN email TYPE TEXT USING email::text;
    // `)
  }
}
