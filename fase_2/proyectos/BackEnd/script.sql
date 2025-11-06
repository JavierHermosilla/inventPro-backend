-- ==========================================================
-- InventPro DDL (ALINEADO A SEQUELIZE underscored: true)
-- ==========================================================

DROP SCHEMA IF EXISTS inventpro_user CASCADE;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA inventpro_user;
SET search_path TO inventpro_user, public;

-- ENUMs
CREATE TYPE enum_users_role               AS ENUM ('user','admin','vendedor','bodeguero');
CREATE TYPE enum_orders_status            AS ENUM ('pending','processing','completed','cancelled');
CREATE TYPE enum_manual_inventories_type  AS ENUM ('increase','decrease');
CREATE TYPE enum_reports_status           AS ENUM ('active','archived','draft');
CREATE TYPE enum_reports_format           AS ENUM ('pdf','xls','dashboard');
CREATE TYPE enum_suppliers_status         AS ENUM ('active','inactive');

-- USERS (paranoid)
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username    VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(100) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  phone       VARCHAR(20),
  address     VARCHAR(255),
  avatar      VARCHAR(255) DEFAULT '',
  role        enum_users_role NOT NULL DEFAULT 'user',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

-- CLIENTS (paranoid)
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  rut         VARCHAR(12)  NOT NULL UNIQUE,
  address     VARCHAR(255) NOT NULL,
  phone       VARCHAR(20)  NOT NULL,
  email       VARCHAR(100) NOT NULL UNIQUE,
  avatar      VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

-- CATEGORIES (paranoid)
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

-- SUPPLIERS (paranoid)
CREATE TABLE suppliers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL UNIQUE,
  rut           VARCHAR(20)  NOT NULL UNIQUE,
  contact_name  VARCHAR(100),
  email         VARCHAR(255),
  phone         VARCHAR(20),
  address       VARCHAR(255),
  website       VARCHAR(255),
  payment_terms VARCHAR(200),
  status        enum_suppliers_status NOT NULL DEFAULT 'active',
  notes         VARCHAR(1000),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

-- PRODUCTS (paranoid)
CREATE TABLE products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(255) NOT NULL UNIQUE,
  description  VARCHAR(500),
  price        NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id  UUID REFERENCES categories(id) ON UPDATE CASCADE ON DELETE SET NULL,
  supplier_id  UUID REFERENCES suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

-- ORDERS (paranoid)
CREATE TABLE orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id    UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  client_id      UUID REFERENCES clients(id) ON UPDATE CASCADE ON DELETE SET NULL,
  status         enum_orders_status NOT NULL DEFAULT 'pending',
  total_amount   NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  stock_restored BOOLEAN NOT NULL DEFAULT FALSE,
  is_backorder   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

-- ORDER_PRODUCTS (si quieres sin paranoid, deja sin deleted_at)
CREATE TABLE order_products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL,
  product_id  UUID NOT NULL,
  quantity    INTEGER NOT NULL CHECK (quantity >= 1),
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_order_products UNIQUE (order_id, product_id),
  CONSTRAINT order_products_order_id_fkey
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT order_products_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- MANUAL INVENTORIES (paranoid)
CREATE TABLE manual_inventories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON UPDATE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE,
  type        enum_manual_inventories_type NOT NULL,
  quantity    INTEGER NOT NULL CHECK (quantity >= 1),
  reason      VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

-- REPORTS (paranoid)
CREATE TABLE reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(100) NOT NULL,
  description      TEXT,
  type             VARCHAR(50) NOT NULL,
  filters          JSONB,
  format           enum_reports_format NOT NULL,
  status           enum_reports_status NOT NULL DEFAULT 'active',
  schedule         JSONB,
  delivery_method  VARCHAR(50),
  shared_with      JSONB,
  last_run_at      TIMESTAMPTZ,
  execution_time_ms INTEGER,
  created_by        UUID REFERENCES users(id) ON UPDATE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

-- SUPPLIER CATEGORIES (N:M)
CREATE TABLE "SupplierCategories" (
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON UPDATE CASCADE ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON UPDATE CASCADE ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (supplier_id, category_id)
);

-- Trigger de inmutabilidad en order_products (opcional si además ya lo bloqueas en modelo)
CREATE OR REPLACE FUNCTION prevent_order_product_mods()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.price      IS DISTINCT FROM OLD.price     THEN RAISE EXCEPTION 'price is immutable once created';     END IF;
  IF NEW.product_id IS DISTINCT FROM OLD.product_id THEN RAISE EXCEPTION 'product_id is immutable once created'; END IF;
  IF NEW.order_id   IS DISTINCT FROM OLD.order_id   THEN RAISE EXCEPTION 'order_id is immutable once created';   END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_lock_order_products ON order_products;
CREATE TRIGGER trg_lock_order_products
  BEFORE UPDATE ON order_products
  FOR EACH ROW
  EXECUTE FUNCTION prevent_order_product_mods();

-- ÍNDICES
CREATE UNIQUE INDEX clients_rut_uniq          ON clients(rut);
CREATE UNIQUE INDEX clients_email_uniq        ON clients(email);
CREATE INDEX clients_name_lower_idx           ON clients (LOWER(name));
CREATE INDEX clients_rut_lower_idx            ON clients (LOWER(rut));

CREATE UNIQUE INDEX categories_name_uniq      ON categories(name);

CREATE UNIQUE INDEX suppliers_rut_uniq        ON suppliers(rut);
CREATE UNIQUE INDEX suppliers_name_uniq       ON suppliers(name);
CREATE INDEX suppliers_name_lower_idx         ON suppliers (LOWER(name));
CREATE INDEX suppliers_rut_lower_idx          ON suppliers (LOWER(rut));
CREATE INDEX suppliers_status_idx             ON suppliers (status);

CREATE UNIQUE INDEX products_name_uniq        ON products(name);
CREATE INDEX products_category_id_idx         ON products(category_id);
CREATE INDEX products_supplier_id_idx         ON products(supplier_id);

CREATE INDEX orders_customer_id_idx           ON orders(customer_id);
CREATE INDEX orders_client_id_idx             ON orders(client_id);
CREATE INDEX orders_status_idx                ON orders(status);
CREATE INDEX orders_is_backorder_idx          ON orders(is_backorder);
CREATE INDEX orders_created_at_idx            ON orders(created_at);

CREATE INDEX order_products_order_id_idx      ON order_products(order_id);
CREATE INDEX order_products_product_id_idx    ON order_products(product_id);

CREATE INDEX manual_inv_product_id_idx        ON manual_inventories(product_id);
CREATE INDEX manual_inv_user_id_idx           ON manual_inventories(user_id);

CREATE INDEX reports_created_by_idx           ON reports(created_by);
