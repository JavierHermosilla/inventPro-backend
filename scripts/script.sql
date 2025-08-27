-- =========================================
-- DROP DE TODO (reinicialización)
-- =========================================
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS manual_inventories CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS enum_users_role;
DROP TYPE IF EXISTS enum_orders_status;
DROP TYPE IF EXISTS enum_manual_inventories_type;
DROP TYPE IF EXISTS enum_reports_status;
DROP TYPE IF EXISTS enum_reports_format;

-- =========================================
-- Extensiones
-- =========================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================
-- ENUMs
-- =========================================
CREATE TYPE enum_users_role AS ENUM ('user','admin');
CREATE TYPE enum_orders_status AS ENUM ('pending','completed','cancelled');
CREATE TYPE enum_manual_inventories_type AS ENUM ('increase','decrease');
CREATE TYPE enum_reports_status AS ENUM ('active','archived','draft');
CREATE TYPE enum_reports_format AS ENUM ('pdf','xls','dashboard');

-- =========================================
-- TABLAS
-- =========================================

-- USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    avatar VARCHAR(255) DEFAULT '',
    role enum_users_role DEFAULT 'user',
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deletedAt TIMESTAMP WITH TIME ZONE
);

-- CLIENTS
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    rut VARCHAR(12) NOT NULL UNIQUE,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    avatar VARCHAR(255),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deletedAt TIMESTAMP WITH TIME ZONE
);

-- CATEGORIES
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- SUPPLIERS
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    contact VARCHAR(100),
    phone VARCHAR(20),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- PRODUCTS
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(255),
    price NUMERIC(10,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    categoryId UUID REFERENCES categories(id) ON UPDATE CASCADE ON DELETE SET NULL,
    supplierId UUID REFERENCES suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deletedAt TIMESTAMP WITH TIME ZONE
);

-- ORDERS
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customerId UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE,
    status enum_orders_status NOT NULL DEFAULT 'pending',
    totalAmount NUMERIC(10,2) NOT NULL,
    stockRestored BOOLEAN NOT NULL DEFAULT FALSE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deletedAt TIMESTAMP WITH TIME ZONE
);

-- MANUAL INVENTORIES
CREATE TABLE manual_inventories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    productId UUID NOT NULL REFERENCES products(id) ON UPDATE CASCADE,
    userId UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE,
    type enum_manual_inventories_type NOT NULL,
    quantity INTEGER NOT NULL,
    reason VARCHAR(255),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- REPORTS
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    filters JSONB,
    format enum_reports_format NOT NULL,
    status enum_reports_status DEFAULT 'active',
    schedule JSONB,
    deliveryMethod VARCHAR(50),
    sharedWith JSONB,
    lastRunAt TIMESTAMP,
    executionTimeMs INTEGER,
    createdBy UUID REFERENCES users(id),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =========================================
-- DATOS DE PRUEBA
-- =========================================

-- Usuarios
INSERT INTO users (username, name, email, password)
VALUES 
('admin', 'Admin User', 'admin@example.com', 'admin123'),
('tester', 'Test User', 'test@example.com', '1234');

-- Clientes
INSERT INTO clients (name, rut, address, phone, email)
VALUES ('Cliente Ejemplo', '12345678-9', 'Av. Siempre Viva 123', '+56912345678', 'cliente@example.com');

-- Categorías
INSERT INTO categories (name, description)
VALUES ('Electrónica', 'Productos electrónicos'),
       ('Hogar', 'Artículos para el hogar');

-- Proveedores
INSERT INTO suppliers (name, contact, phone)
VALUES ('Proveedor 1', 'Contacto 1', '+56911111111'),
       ('Proveedor 2', 'Contacto 2', '+56922222222');

-- Productos
INSERT INTO products (name, description, price, stock, categoryId, supplierId)
VALUES 
('Televisor', 'Televisor LED 50"', 500000, 10, (SELECT id FROM categories WHERE name='Electrónica'), (SELECT id FROM suppliers WHERE name='Proveedor 1')),
('Licuadora', 'Licuadora 500W', 45000, 20, (SELECT id FROM categories WHERE name='Hogar'), (SELECT id FROM suppliers WHERE name='Proveedor 2'));

-- Órdenes
INSERT INTO orders (customerId, status, totalAmount)
VALUES ((SELECT id FROM users WHERE username='tester'), 'pending', 545000);

-- Inventarios manuales
INSERT INTO manual_inventories (productId, userId, type, quantity, reason)
VALUES ((SELECT id FROM products WHERE name='Televisor'), (SELECT id FROM users WHERE username='tester'), 'increase', 5, 'Ajuste inicial');

-- Reportes
INSERT INTO reports (name, type, format, createdBy)
VALUES ('Reporte Test', 'inventario', 'pdf', (SELECT id FROM users WHERE username='tester'));
