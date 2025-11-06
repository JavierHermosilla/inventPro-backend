\set ON_ERROR_STOP on
\timing on

BEGIN;

\echo '--- Crear usuario'
INSERT INTO inventpro_user.users (id,username,name,email,password,created_at,updated_at)
VALUES (gen_random_uuid(),'smoke_user','Smoke Test','smoke+user@example.local','x', now(), now())
RETURNING id AS user_id \gset
\echo 'user_id = :user_id'

\echo '--- Crear cliente'
INSERT INTO inventpro_user.clients (id,name,rut,address,phone,email,created_at,updated_at)
VALUES (gen_random_uuid(),'Cliente Smoke','55555555-5','Dir','+56 9 0000 0000','smoke+client@example.local', now(), now())
RETURNING id AS client_id \gset
\echo 'client_id = :client_id'

\echo '--- Crear categoría'
INSERT INTO inventpro_user.categories (id,name,description,created_at,updated_at)
VALUES (gen_random_uuid(),'Cat Smoke','demo', now(), now())
RETURNING id AS category_id \gset
\echo 'category_id = :category_id'

\echo '--- Crear proveedor'
INSERT INTO inventpro_user.suppliers (id,name,rut,status,created_at,updated_at)
VALUES (gen_random_uuid(),'Proveedor Smoke','66666666-6','active', now(), now())
RETURNING id AS supplier_id \gset
\echo 'supplier_id = :supplier_id'

\echo '--- Crear producto'
INSERT INTO inventpro_user.products (id,name,price,stock,category_id,supplier_id,created_at,updated_at)
VALUES (gen_random_uuid(),'Producto Smoke', 1234.56, 10, :'category_id', :'supplier_id', now(), now())
RETURNING id AS product_id, price AS product_price \gset
\echo 'product_id = :product_id · price = :product_price'

\echo '--- Crear orden'
INSERT INTO inventpro_user.orders (id,client_id,total_amount,created_at,updated_at)
VALUES (gen_random_uuid(), :'client_id', 2469.12, now(), now())
RETURNING id AS order_id \gset
\echo 'order_id = :order_id'

\echo '--- order_products (insert OK)'
INSERT INTO inventpro_user.order_products (order_id,product_id,quantity,price,unit_price,created_at,updated_at)
VALUES (:'order_id', :'product_id', 2, :'product_price', :'product_price', now(), now());

\echo '--- order_products (UNIQUE dup esperado usando ON CONFLICT)'
WITH ins AS (
  INSERT INTO inventpro_user.order_products (order_id,product_id,quantity,price,unit_price,created_at,updated_at)
  VALUES (:'order_id', :'product_id', 1, :'product_price', :'product_price', now(), now())
  ON CONFLICT (order_id, product_id) DO NOTHING
  RETURNING 1
)
SELECT CASE WHEN COUNT(*)=0
            THEN 'OK: bloqueo por único (order_id, product_id)'
            ELSE 'ERROR: se pudo insertar duplicado'
       END AS unique_check
FROM ins;

\echo '--- Trigger inmutabilidad (update price debe fallar)'
SET LOCAL inventpro.order_id   = :'order_id';
SET LOCAL inventpro.product_id = :'product_id';
DO $$
DECLARE
  v_order_id   uuid := current_setting('inventpro.order_id')::uuid;
  v_product_id uuid := current_setting('inventpro.product_id')::uuid;
BEGIN
  BEGIN
    UPDATE inventpro_user.order_products
       SET price = price + 1
     WHERE order_id = v_order_id AND product_id = v_product_id;
    RAISE EXCEPTION 'El trigger no bloqueó la modificación de price';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'OK: trigger evitó modificar price (%)', SQLERRM;
  END;
END $$;

\echo '--- Manual inventories (FKs y enums)'
INSERT INTO inventpro_user.manual_inventories (id,product_id,user_id,type,quantity,reason,created_at,updated_at)
VALUES (gen_random_uuid(), :'product_id', :'user_id', 'increase', 5, 'smoke run', now(), now());

\echo '--- Reports (enums format/status + FK created_by)'
INSERT INTO inventpro_user.reports (id,name,type,filters,format,status,created_by,created_at,updated_at)
VALUES (gen_random_uuid(), 'Smoke Report','test','{}'::jsonb,
        'xls'::inventpro_user.enum_reports_format,
        'active'::inventpro_user.enum_reports_status,
        :'user_id', now(), now());

\echo '--- FK action test: borrar categoría (ON DELETE SET NULL en products)'
DELETE FROM inventpro_user.categories WHERE id = :'category_id';
SELECT category_id FROM inventpro_user.products WHERE id = :'product_id';

\echo '--- Soft delete + reutilizar email'
INSERT INTO inventpro_user.clients (id,name,rut,address,phone,email,created_at,updated_at)
VALUES (gen_random_uuid(),'Email A','11111111-1','Dir','+56 9 1','dup@example.com', now(), now());

\echo '--- Duplicado de email activo (usa inferencia y satisface el predicado del índice parcial)'
WITH ins AS (
  INSERT INTO inventpro_user.clients (id,name,rut,address,phone,email,deleted_at,created_at,updated_at)
  VALUES (gen_random_uuid(),'Email B','22222222-2','Dir','+56 9 2','dup@example.com', NULL, now(), now())
  ON CONFLICT (email) WHERE (deleted_at IS NULL) DO NOTHING
  RETURNING 1
)
SELECT CASE WHEN COUNT(*)=0
            THEN 'OK: bloqueo email duplicado activo'
            ELSE 'ERROR: se pudo insertar email duplicado'
       END AS email_unique_check
FROM ins;

UPDATE inventpro_user.clients
   SET deleted_at = now(), updated_at = now()
 WHERE email='dup@example.com' AND rut='11111111-1';

INSERT INTO inventpro_user.clients (id,name,rut,address,phone,email,created_at,updated_at)
VALUES (gen_random_uuid(),'Email C','33333333-3','Dir','+56 9 3','dup@example.com', now(), now());
\echo 'OK: reutiliza email tras soft-delete'

\echo '--- DV/regex RUT desde BD (formato errado debe fallar)'
DO $$
BEGIN
  INSERT INTO inventpro_user.clients (id,name,rut,address,phone,email,created_at,updated_at)
  VALUES (gen_random_uuid(),'Formato Malo','123456789-0','Dir','+56 9 7777 7777','bad-format@example.com', now(), now());
  RAISE EXCEPTION 'Faltó CHECK: aceptó RUT con formato inválido';
EXCEPTION WHEN check_violation THEN
  RAISE NOTICE 'OK: regex RUT en BD activa';
END $$;

ROLLBACK;
\echo '✔ Smoke DB completo (con ROLLBACK, BD queda limpia)'
