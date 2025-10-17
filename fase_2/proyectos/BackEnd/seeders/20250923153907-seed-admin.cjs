'use strict'

const bcrypt = require('bcryptjs')

module.exports = {
  async up (queryInterface) {
    const hash = await bcrypt.hash('Admin123!', 10)

    // Asegúrate de tener la extensión para gen_random_uuid()
    // En tu BD:  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    // UPSERT por email (puedes añadir también UNIQUE en email en la BD)
    await queryInterface.sequelize.query(`
      INSERT INTO "inventpro_user"."users"
        ("id","username","name","email","password","phone","address","avatar","role","created_at","updated_at")
      VALUES
        (gen_random_uuid(),'admin','Administrador','admin@inventpro.cl', :hash, NULL, NULL, NULL, 'admin', NOW(), NOW())
      ON CONFLICT ("email") DO UPDATE
      SET
        username   = EXCLUDED.username,
        name       = EXCLUDED.name,
        password   = EXCLUDED.password,
        role       = EXCLUDED.role,
        updated_at = NOW();
    `, { replacements: { hash } })
  },

  // ⚠️ Recomiendo NO borrar en down para evitar violar FKs.
  // Si insistes en borrar, hazlo bajo tu responsabilidad.
  async down () {
    // no-op
  }
}
