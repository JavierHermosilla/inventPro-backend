-- ==========================================
-- PostgreSQL Introspection - InventPro
-- Lista TODO lo relevante de un schema
-- ==========================================

\pset pager off
\pset border 2
\timing on

-- 🔧 Configurable: schema objetivo
\set schema 'inventpro_user'

-- 🧭 Contexto de sesión
\echo ==== CONTEXTO ====
SELECT
  current_database()               AS database,
  current_user                     AS user,
  current_schema                   AS current_schema,
  current_setting('search_path')   AS search_path,
  version()                        AS version;

-- 📚 Schemas visibles (no pg_*, no information_schema)
\echo ==== SCHEMAS DISPONIBLES ====
SELECT nspname AS schema
FROM pg_namespace
WHERE nspname NOT LIKE 'pg\_%' AND nspname <> 'information_schema'
ORDER BY 1;

-- 📦 Tamaño total del schema
\echo ==== TAMAÑO DEL SCHEMA ====
SELECT
  :'schema' AS schema,
  pg_size_pretty(SUM(pg_total_relation_size(c.oid))) AS total_size
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = :'schema'
  AND c.relkind IN ('r','m','i','S','t');

-- 🗂️ Tablas del schema y su tamaño
\echo ==== TABLAS (CON TAMAÑO) ====
SELECT
  n.nspname AS schema,
  c.relname AS table,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
  pg_size_pretty(pg_relation_size(c.oid))       AS table_size,
  pg_size_pretty(pg_indexes_size(c.oid))        AS indexes_size
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = :'schema'
  AND c.relkind = 'r'
ORDER BY c.relname;

-- 🧱 Columnas por tabla
\echo ==== COLUMNAS ====
SELECT
  table_schema, table_name, ordinal_position,
  column_name, data_type,
  is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = :'schema'
ORDER BY table_name, ordinal_position;

-- 🔑 Primary Keys
\echo ==== PRIMARY KEYS ====
SELECT
  n.nspname AS schema,
  c.relname AS table,
  con.conname AS pk_name,
  pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class c       ON c.oid = con.conrelid
JOIN pg_namespace n   ON n.oid = c.relnamespace
WHERE con.contype = 'p'
  AND n.nspname = :'schema'
ORDER BY c.relname, con.conname;

-- 🔒 Unique Constraints
\echo ==== UNIQUE CONSTRAINTS ====
SELECT
  n.nspname AS schema,
  c.relname AS table,
  con.conname AS uq_name,
  pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class c       ON c.oid = con.conrelid
JOIN pg_namespace n   ON n.oid = c.relnamespace
WHERE con.contype = 'u'
  AND n.nspname = :'schema'
ORDER BY c.relname, con.conname;

-- 🔗 Foreign Keys
\echo ==== FOREIGN KEYS ====
SELECT
  n.nspname AS schema,
  c.relname AS table,
  con.conname AS fk_name,
  pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class c       ON c.oid = con.conrelid
JOIN pg_namespace n   ON n.oid = c.relnamespace
WHERE con.contype = 'f'
  AND n.nspname = :'schema'
ORDER BY c.relname, con.conname;

-- ✅ Check Constraints
\echo ==== CHECK CONSTRAINTS ====
SELECT
  n.nspname AS schema,
  c.relname AS table,
  con.conname AS check_name,
  pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class c       ON c.oid = con.conrelid
JOIN pg_namespace n   ON n.oid = c.relnamespace
WHERE con.contype = 'c'
  AND n.nspname = :'schema'
ORDER BY c.relname, con.conname;

-- 🧭 Índices
\echo ==== ÍNDICES ====
SELECT
  n.nspname AS schema,
  t.relname AS table,
  i.relname AS index,
  pg_get_indexdef(ix.indexrelid) AS definition,
  ix.indisunique AS is_unique,
  ix.indisprimary AS is_primary
FROM pg_index ix
JOIN pg_class t      ON t.oid = ix.indrelid
JOIN pg_class i      ON i.oid = ix.indexrelid
JOIN pg_namespace n  ON n.oid = t.relnamespace
WHERE n.nspname = :'schema'
ORDER BY t.relname, i.relname;

-- 🔔 Triggers
\echo ==== TRIGGERS ====
SELECT
  event_object_schema AS schema,
  event_object_table  AS table,
  trigger_name,
  action_timing,
  string_agg(event_manipulation, ', ' ORDER BY event_manipulation) AS events,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = :'schema'
GROUP BY 1,2,3,4,6
ORDER BY 2,3;

-- 🎛️ Funciones definidas en el schema
\echo ==== FUNCIONES ====
SELECT
  n.nspname AS schema,
  p.proname AS function,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = :'schema'
ORDER BY p.proname;

-- 🧩 Enums del schema
\echo ==== ENUMS ====
SELECT
  n.nspname AS schema,
  t.typname AS enum_name,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS labels
FROM pg_type t
JOIN pg_enum e      ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = :'schema'
GROUP BY 1,2
ORDER BY 2;

-- 🔢 Secuencias
\echo ==== SECUENCIAS ====
SELECT sequence_schema, sequence_name, data_type, start_value, minimum_value, maximum_value, increment, cycle_option
FROM information_schema.sequences
WHERE sequence_schema = :'schema'
ORDER BY sequence_name;

-- 👀 Views
\echo ==== VIEWS ====
SELECT table_schema, table_name, view_definition
FROM information_schema.views
WHERE table_schema = :'schema'
ORDER BY table_name;

-- 🧊 Materialized Views
\echo ==== MATERIALIZED VIEWS ====
SELECT schemaname AS schema, matviewname AS name, pg_get_viewdef(matviewoid) AS definition
FROM pg_matviews
WHERE schemaname = :'schema'
ORDER BY matviewname;

-- 🔐 Privilegios sobre tablas
\echo ==== PRIVILEGIOS DE TABLAS ====
SELECT table_schema, table_name, grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = :'schema'
ORDER BY table_name, grantee, privilege_type;

-- 🧱 Propietarios de tablas
\echo ==== PROPIETARIOS DE TABLAS ====
SELECT
  n.nspname AS schema,
  c.relname AS table,
  pg_catalog.pg_get_userbyid(c.relowner) AS owner
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = :'schema'
  AND c.relkind = 'r'
ORDER BY c.relname;

-- 🧩 Extensiones instaladas (no por schema)
\echo ==== EXTENSIONES INSTALADAS ====
SELECT extname, extversion, nspname AS schema
FROM pg_extension e
JOIN pg_namespace n ON n.oid = e.extnamespace
ORDER BY 1;

-- 🧪 (Útil) Buscar por nombre de constraint/índice en TODOS los schemas
-- Reemplaza 'NOMBRE_A_BUSCAR' por tu caso (p. ej. uq_order_products_order_id_product_id)
-- \echo ==== BUSCAR CONSTRAINT/ÍNDICE POR NOMBRE EN TODOS LOS SCHEMAS ====
-- SELECT n.nspname AS schema, t.relname AS table, con.conname AS constraint_name, con.contype
-- FROM pg_constraint con
-- JOIN pg_class t ON t.oid = con.conrelid
-- JOIN pg_namespace n ON n.oid = t.relnamespace
-- WHERE con.conname = 'NOMBRE_A_BUSCAR';
--
-- SELECT n.nspname AS schema, c.relname AS index_name
-- FROM pg_class c
-- JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE c.relkind = 'i' AND c.relname = 'NOMBRE_A_BUSCAR';
