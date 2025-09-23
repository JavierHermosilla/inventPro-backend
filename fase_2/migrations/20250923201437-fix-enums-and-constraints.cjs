'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. Agregar valor 'processing' al enum de órdenes
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'enum_orders_status'
          AND e.enumlabel = 'processing'
        ) THEN
          ALTER TYPE inventpro_user.enum_orders_status ADD VALUE 'processing';
        END IF;
      END$$;
    `)

    // 2. Agregar valor 'xls' al enum de reports.format
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'enum_reports_format'
          AND e.enumlabel = 'xls'
        ) THEN
          ALTER TYPE inventpro_user.enum_reports_format ADD VALUE 'xls';
        END IF;
      END$$;
    `)

    // 3. Agregar constraint único a order_products
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'unique_order_product'
          AND conrelid = 'inventpro_user.order_products'::regclass
        ) THEN
          ALTER TABLE inventpro_user.order_products
          ADD CONSTRAINT unique_order_product UNIQUE(order_id, product_id);
        END IF;
      END$$;
    `)
  },

  async down (queryInterface, Sequelize) {
    // Revertir constraint único
    await queryInterface.sequelize.query(`
      ALTER TABLE inventpro_user.order_products
      DROP CONSTRAINT IF EXISTS unique_order_product;
    `)

    // Nota: Los enums en Postgres no se pueden "quitar" fácilmente.
    // Si quieres, puedes documentar que el rollback no borra los valores agregados.
  }
}
