'use strict'

const schema = process.env.DB_SCHEMA || 'inventpro_user'

module.exports = {
  async up (queryInterface, Sequelize) {
    // 0) Schema + extensiones
    if (queryInterface.createSchema) {
      await queryInterface.createSchema(schema).catch(() => {})
    }
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')

    // 1) users
    await queryInterface.createTable(
      { tableName: 'users', schema },
      {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
        username: { type: Sequelize.STRING(50), allowNull: false, unique: true },
        name: { type: Sequelize.STRING(255), allowNull: false },
        email: { type: Sequelize.STRING(150), allowNull: false, unique: true },
        password: { type: Sequelize.STRING(255), allowNull: false },
        phone: { type: Sequelize.STRING(20), allowNull: true },
        address: { type: Sequelize.STRING(255), allowNull: true },
        avatar: { type: Sequelize.STRING(255), allowNull: true },
        role: {
          type: Sequelize.ENUM('user', 'admin', 'vendedor', 'bodeguero'),
          allowNull: false,
          defaultValue: 'user'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      }
    )

    // 2) clients
    await queryInterface.createTable(
      { tableName: 'clients', schema },
      {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
        name: { type: Sequelize.STRING(100), allowNull: false },
        rut: { type: Sequelize.STRING(12), allowNull: false, unique: true },
        address: { type: Sequelize.STRING(255), allowNull: false },
        phone: { type: Sequelize.STRING(20), allowNull: false },
        email: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        avatar: { type: Sequelize.STRING(255), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      }
    )

    // 3) categories
    await queryInterface.createTable(
      { tableName: 'categories', schema },
      {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
        name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        description: { type: Sequelize.STRING(500), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      }
    )

    // 4) suppliers
    await queryInterface.createTable(
      { tableName: 'suppliers', schema },
      {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
        name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        rut: { type: Sequelize.STRING(20), allowNull: false, unique: true },
        contact_name: { type: Sequelize.STRING(100), allowNull: true },
        email: { type: Sequelize.STRING(255), allowNull: true },
        phone: { type: Sequelize.STRING(20), allowNull: true },
        address: { type: Sequelize.STRING(255), allowNull: true },
        website: { type: Sequelize.STRING(255), allowNull: true },
        payment_terms: { type: Sequelize.STRING(200), allowNull: true },
        status: { type: Sequelize.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
        notes: { type: Sequelize.STRING(1000), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      }
    )

    // 5) products
    await queryInterface.createTable(
      { tableName: 'products', schema },
      {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
        name: { type: Sequelize.STRING(255), allowNull: false, unique: true },
        description: { type: Sequelize.STRING(500), allowNull: true },
        price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        category_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: { tableName: 'categories', schema }, key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        supplier_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: { tableName: 'suppliers', schema }, key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      }
    )

    // 6) orders
    await queryInterface.createTable(
      { tableName: 'orders', schema },
      {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
        customer_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: { tableName: 'users', schema }, key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        client_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: { tableName: 'clients', schema }, key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        status: {
          type: Sequelize.ENUM('pending', 'processing', 'completed', 'cancelled'),
          allowNull: false,
          defaultValue: 'pending'
        },
        total_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        stock_restored: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        is_backorder: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      }
    )

    // 7) order_products
    await queryInterface.createTable(
      { tableName: 'order_products', schema },
      {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
        order_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: { tableName: 'orders', schema }, key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        product_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: { tableName: 'products', schema }, key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        quantity: { type: Sequelize.INTEGER, allowNull: false },
        price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      }
    )

    // Pre-drop defensivo del UNIQUE compuesto (idempotente)
    await queryInterface.sequelize.query(`
      DO $$
DECLARE
  v_schema  text := '${schema}';
  v_conname text := 'uq_inv_order_products_order_id_product_id';
BEGIN
  -- Si ya existía como constraint en el schema destino, bórralo
  IF EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class t ON t.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE con.conname = v_conname
      AND n.nspname = v_schema
      AND t.relname = 'order_products'
  ) THEN
    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I', v_schema, 'order_products', v_conname);
  END IF;

  -- Si quedara un índice huérfano con el mismo nombre, bórralo
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = v_conname
      AND n.nspname = v_schema
      AND c.relkind = 'i'
  ) THEN
    EXECUTE format('DROP INDEX IF EXISTS %I.%I', v_schema, v_conname);
  END IF;
END $$;
    `)

    await queryInterface.addConstraint(
      { tableName: 'order_products', schema },
      { type: 'unique', fields: ['order_id', 'product_id'], name: 'uq_inv_order_products_order_id_product_id' }
    )

    // 8) manual_inventories
    await queryInterface.createTable(
      { tableName: 'manual_inventories', schema },
      {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
        product_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: { tableName: 'products', schema }, key: 'id' },
          onUpdate: 'CASCADE'
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: { tableName: 'users', schema }, key: 'id' },
          onUpdate: 'CASCADE'
        },
        type: { type: Sequelize.ENUM('increase', 'decrease'), allowNull: false },
        quantity: { type: Sequelize.INTEGER, allowNull: false },
        reason: { type: Sequelize.STRING(255), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      }
    )

    // 9) reports
    await queryInterface.createTable(
      { tableName: 'reports', schema },
      {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
        name: { type: Sequelize.STRING(100), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: true },
        type: { type: Sequelize.STRING(50), allowNull: false },
        filters: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
        format: { type: Sequelize.ENUM('pdf', 'xls', 'dashboard'), allowNull: false },
        status: { type: Sequelize.ENUM('active', 'archived', 'draft'), allowNull: false, defaultValue: 'active' },
        schedule: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
        delivery_method: { type: Sequelize.STRING(50), allowNull: true },
        shared_with: { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
        last_run_at: { type: Sequelize.DATE, allowNull: true },
        execution_time_ms: { type: Sequelize.INTEGER, allowNull: true },
        created_by: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: { tableName: 'users', schema }, key: 'id' },
          onUpdate: 'CASCADE'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        deleted_at: { type: Sequelize.DATE, allowNull: true }
      }
    )

    // 10) SupplierCategories (join M:N)
    await queryInterface.createTable(
      { tableName: 'SupplierCategories', schema },
      {
        supplier_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: { tableName: 'suppliers', schema }, key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        category_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: { tableName: 'categories', schema }, key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      }
    )

    await queryInterface.addConstraint(
      { tableName: 'SupplierCategories', schema },
      { type: 'primary key', fields: ['supplier_id', 'category_id'], name: 'pk_supplier_categories' }
    )

    // === Índices útiles (no duplicar los UNIQUE ya definidos en createTable) ===

    // Índices funcionales con SQL crudo (LOWER(...))
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS clients_name_lower_idx
      ON "${schema}".clients (LOWER(name));
    `)
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS clients_rut_lower_idx
      ON "${schema}".clients (LOWER(rut));
    `)
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS suppliers_name_lower_idx
      ON "${schema}".suppliers (LOWER(name));
    `)
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS suppliers_rut_lower_idx
      ON "${schema}".suppliers (LOWER(rut));
    `)

    // Índices normales
    await queryInterface.addIndex({ tableName: 'suppliers', schema }, ['status'], { name: 'suppliers_status_idx' })
    await queryInterface.addIndex({ tableName: 'products', schema }, ['category_id'], { name: 'products_category_id_idx' })
    await queryInterface.addIndex({ tableName: 'products', schema }, ['supplier_id'], { name: 'products_supplier_id_idx' })
    await queryInterface.addIndex({ tableName: 'orders', schema }, ['customer_id'], { name: 'orders_customer_id_idx' })
    await queryInterface.addIndex({ tableName: 'orders', schema }, ['client_id'], { name: 'orders_client_id_idx' })
    await queryInterface.addIndex({ tableName: 'orders', schema }, ['status'], { name: 'orders_status_idx' })
    await queryInterface.addIndex({ tableName: 'orders', schema }, ['is_backorder'], { name: 'orders_is_backorder_idx' })
    await queryInterface.addIndex({ tableName: 'orders', schema }, ['created_at'], { name: 'orders_created_at_idx' })
    await queryInterface.addIndex({ tableName: 'order_products', schema }, ['order_id'], { name: 'order_products_order_id_idx' })
    await queryInterface.addIndex({ tableName: 'order_products', schema }, ['product_id'], { name: 'order_products_product_id_idx' })
    await queryInterface.addIndex({ tableName: 'manual_inventories', schema }, ['product_id'], { name: 'manual_inv_product_id_idx' })
    await queryInterface.addIndex({ tableName: 'manual_inventories', schema }, ['user_id'], { name: 'manual_inv_user_id_idx' })
    await queryInterface.addIndex({ tableName: 'reports', schema }, ['created_by'], { name: 'reports_created_by_idx' })

    // === Trigger: impedir modificar order_products (inmutable)
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION ${schema}.prevent_order_product_mods()
      RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.price      IS DISTINCT FROM OLD.price      THEN RAISE EXCEPTION 'price is immutable once created';      END IF;
        IF NEW.product_id IS DISTINCT FROM OLD.product_id THEN RAISE EXCEPTION 'product_id is immutable once created'; END IF;
        IF NEW.order_id   IS DISTINCT FROM OLD.order_id   THEN RAISE EXCEPTION 'order_id is immutable once created';   END IF;
        RETURN NEW;
      END $$;
    `)

    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trg_lock_order_products ON ${schema}."order_products";
      CREATE TRIGGER trg_lock_order_products
      BEFORE UPDATE ON ${schema}."order_products"
      FOR EACH ROW
      EXECUTE FUNCTION ${schema}.prevent_order_product_mods();
    `)
  },

  async down (queryInterface, Sequelize) {
    const drop = async (table) => queryInterface.dropTable({ tableName: table, schema })

    // Triggers
    await queryInterface.sequelize.query(`DROP TRIGGER IF EXISTS trg_lock_order_products ON ${schema}."order_products";`)
    await queryInterface.sequelize.query(`DROP FUNCTION IF EXISTS ${schema}.prevent_order_product_mods();`)

    // Tablas (orden inverso)
    await drop('SupplierCategories')
    await drop('reports')
    await drop('manual_inventories')
    await drop('order_products')
    await drop('orders')
    await drop('products')
    await drop('suppliers')
    await drop('categories')
    await drop('clients')
    await drop('users')

    // Tipos enum que Sequelize crea por convención
    const enumNames = [
      'enum_users_role',
      'enum_orders_status',
      'enum_manual_inventories_type',
      'enum_reports_format',
      'enum_reports_status',
      'enum_suppliers_status'
    ]
    for (const t of enumNames) {
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          EXECUTE 'DROP TYPE IF EXISTS "${t}"';
        EXCEPTION WHEN OTHERS THEN NULL;
        END $$;
      `)
    }
  }
}
