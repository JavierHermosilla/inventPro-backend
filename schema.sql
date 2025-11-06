--
-- PostgreSQL database dump
--

\restrict 1c3TwEiAcea2pBR9mAqbkdb9a3VDPxg8QPviwsucOEOweZg9e5AxjH303WC2or1

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: inventpro_user; Type: SCHEMA; Schema: -; Owner: inventpro_user
--

CREATE SCHEMA inventpro_user;


ALTER SCHEMA inventpro_user OWNER TO inventpro_user;

--
-- Name: enum_manual_inventories_type; Type: TYPE; Schema: inventpro_user; Owner: inventpro_user
--

CREATE TYPE inventpro_user.enum_manual_inventories_type AS ENUM (
    'increase',
    'decrease'
);


ALTER TYPE inventpro_user.enum_manual_inventories_type OWNER TO inventpro_user;

--
-- Name: enum_orders_status; Type: TYPE; Schema: inventpro_user; Owner: inventpro_user
--

CREATE TYPE inventpro_user.enum_orders_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'cancelled'
);


ALTER TYPE inventpro_user.enum_orders_status OWNER TO inventpro_user;

--
-- Name: enum_reports_format; Type: TYPE; Schema: inventpro_user; Owner: inventpro_user
--

CREATE TYPE inventpro_user.enum_reports_format AS ENUM (
    'pdf',
    'xls',
    'dashboard'
);


ALTER TYPE inventpro_user.enum_reports_format OWNER TO inventpro_user;

--
-- Name: enum_reports_status; Type: TYPE; Schema: inventpro_user; Owner: inventpro_user
--

CREATE TYPE inventpro_user.enum_reports_status AS ENUM (
    'active',
    'archived',
    'draft'
);


ALTER TYPE inventpro_user.enum_reports_status OWNER TO inventpro_user;

--
-- Name: enum_suppliers_status; Type: TYPE; Schema: inventpro_user; Owner: inventpro_user
--

CREATE TYPE inventpro_user.enum_suppliers_status AS ENUM (
    'active',
    'inactive'
);


ALTER TYPE inventpro_user.enum_suppliers_status OWNER TO inventpro_user;

--
-- Name: enum_users_role; Type: TYPE; Schema: inventpro_user; Owner: inventpro_user
--

CREATE TYPE inventpro_user.enum_users_role AS ENUM (
    'user',
    'admin',
    'vendedor',
    'bodeguero'
);


ALTER TYPE inventpro_user.enum_users_role OWNER TO inventpro_user;

--
-- Name: prevent_order_product_mods(); Type: FUNCTION; Schema: inventpro_user; Owner: inventpro_user
--

CREATE FUNCTION inventpro_user.prevent_order_product_mods() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        IF NEW.price      IS DISTINCT FROM OLD.price      THEN RAISE EXCEPTION 'price is immutable once created';      END IF;
        IF NEW.product_id IS DISTINCT FROM OLD.product_id THEN RAISE EXCEPTION 'product_id is immutable once created'; END IF;
        IF NEW.order_id   IS DISTINCT FROM OLD.order_id   THEN RAISE EXCEPTION 'order_id is immutable once created';   END IF;
        RETURN NEW;
      END $$;


ALTER FUNCTION inventpro_user.prevent_order_product_mods() OWNER TO inventpro_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: SequelizeMeta; Type: TABLE; Schema: inventpro_user; Owner: inventpro_user
--

CREATE TABLE inventpro_user."SequelizeMeta" (
    name character varying(255) NOT NULL
);


ALTER TABLE inventpro_user."SequelizeMeta" OWNER TO inventpro_user;

--
-- Name: SupplierCategories; Type: TABLE; Schema: inventpro_user; Owner: inventpro_user
--

CREATE TABLE inventpro_user."SupplierCategories" (
    supplier_id uuid NOT NULL,
    category_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE inventpro_user."SupplierCategories" OWNER TO inventpro_user;

--
-- Name: categories; Type: TABLE; Schema: inventpro_user; Owner: inventpro_user
--

CREATE TABLE inventpro_user.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE inventpro_user.categories OWNER TO inventpro_user;

--
-- Name: clients; Type: TABLE; Schema: inventpro_user; Owner: inventpro_user
--

CREATE TABLE inventpro_user.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    rut character varying(255) NOT NULL,
    address character varying(255) NOT NULL,
    phone character varying(255) NOT NULL,
    email inventpro_user.citext NOT NULL,
    avatar character varying(255) DEFAULT NULL::character varying,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT clients_rut_format_chk CHECK (((rut)::text ~ '^[0-9]{7,8}-[0-9Kk]$'::text))
);


ALTER TABLE inventpro_user.clients OWNER TO inventpro_user;

--
-- Name: manual_inventories; Type: TABLE; Schema: inventpro_user; Owner: inventpro_user
--

CREATE TABLE inventpro_user.manual_inventories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    user_id uuid NOT NULL,
    type inventpro_user.enum_manual_inventories_type NOT NULL,
    quantity integer NOT NULL,
    reason character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE inventpro_user.manual_inventories OWNER TO inventpro_user;

--
-- Name: order_products; Type: TABLE; Schema: inventpro_user; Owner: inventpro_user
--

CREATE TABLE inventpro_user.order_products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    price numeric(10,2) DEFAULT 0 NOT NULL
);


ALTER TABLE inventpro_user.order_products OWNER TO inventpro_user;

--
-- Name: orders; Type: TABLE; Schema: inventpro_user; Owner: inventpro_user
--

CREATE TABLE inventpro_user.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id uuid NOT NULL,
    status inventpro_user.enum_orders_status DEFAULT 'pending'::inventpro_user.enum_orders_status NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    stock_restored boolean DEFAULT false NOT NULL,
    is_backorder boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE inventpro_user.orders OWNER TO inventpro_user;

--
-- Name: products; Type: TABLE; Schema: inventpro_user; Owner: inventpro_user
--

CREATE TABLE inventpro_user.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    price numeric(10,2) NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    category_id uuid,
    supplier_id uuid,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE inventpro_user.products OWNER TO inventpro_user;

--
-- Name: reports; Type: TABLE; Schema: inventpro_user; Owner: inventpro_user
--

CREATE TABLE inventpro_user.reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    type character varying(255) NOT NULL,
    filters jsonb DEFAULT '{}'::jsonb NOT NULL,
    format inventpro_user.enum_reports_format NOT NULL,
    status inventpro_user.enum_reports_status DEFAULT 'active'::inventpro_user.enum_reports_status NOT NULL,
    schedule jsonb DEFAULT '{}'::jsonb NOT NULL,
    delivery_method character varying(255),
    shared_with jsonb DEFAULT '[]'::jsonb NOT NULL,
    last_run_at timestamp with time zone,
    execution_time_ms integer,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE inventpro_user.reports OWNER TO inventpro_user;

--
-- Name: suppliers; Type: TABLE; Schema: inventpro_user; Owner: inventpro_user
--

CREATE TABLE inventpro_user.suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    rut character varying(255) NOT NULL,
    contact_name character varying(255),
    email character varying(255),
    phone character varying(255),
    address character varying(255),
    website character varying(255),
    payment_terms character varying(255),
    status inventpro_user.enum_suppliers_status DEFAULT 'active'::inventpro_user.enum_suppliers_status NOT NULL,
    notes character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE inventpro_user.suppliers OWNER TO inventpro_user;

--
-- Name: users; Type: TABLE; Schema: inventpro_user; Owner: inventpro_user
--

CREATE TABLE inventpro_user.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(50) NOT NULL,
    name character varying(120) NOT NULL,
    email character varying(150) NOT NULL,
    password character varying(255) NOT NULL,
    phone character varying(20),
    address character varying(255) DEFAULT NULL::character varying,
    avatar character varying(255) DEFAULT NULL::character varying,
    role inventpro_user.enum_users_role DEFAULT 'user'::inventpro_user.enum_users_role NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE inventpro_user.users OWNER TO inventpro_user;

--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: manual_inventories manual_inventories_pkey; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_pkey PRIMARY KEY (id);


--
-- Name: order_products order_products_pkey; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: SupplierCategories pk_supplier_categories; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user."SupplierCategories"
    ADD CONSTRAINT pk_supplier_categories PRIMARY KEY (supplier_id, category_id);


--
-- Name: products products_name_key; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key UNIQUE (name);


--
-- Name: products products_name_key1; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key1 UNIQUE (name);


--
-- Name: products products_name_key10; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key10 UNIQUE (name);


--
-- Name: products products_name_key11; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key11 UNIQUE (name);


--
-- Name: products products_name_key12; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key12 UNIQUE (name);


--
-- Name: products products_name_key13; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key13 UNIQUE (name);


--
-- Name: products products_name_key14; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key14 UNIQUE (name);


--
-- Name: products products_name_key15; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key15 UNIQUE (name);


--
-- Name: products products_name_key16; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key16 UNIQUE (name);


--
-- Name: products products_name_key17; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key17 UNIQUE (name);


--
-- Name: products products_name_key18; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key18 UNIQUE (name);


--
-- Name: products products_name_key19; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key19 UNIQUE (name);


--
-- Name: products products_name_key2; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key2 UNIQUE (name);


--
-- Name: products products_name_key20; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key20 UNIQUE (name);


--
-- Name: products products_name_key21; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key21 UNIQUE (name);


--
-- Name: products products_name_key22; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key22 UNIQUE (name);


--
-- Name: products products_name_key23; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key23 UNIQUE (name);


--
-- Name: products products_name_key24; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key24 UNIQUE (name);


--
-- Name: products products_name_key25; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key25 UNIQUE (name);


--
-- Name: products products_name_key26; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key26 UNIQUE (name);


--
-- Name: products products_name_key27; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key27 UNIQUE (name);


--
-- Name: products products_name_key28; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key28 UNIQUE (name);


--
-- Name: products products_name_key29; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key29 UNIQUE (name);


--
-- Name: products products_name_key3; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key3 UNIQUE (name);


--
-- Name: products products_name_key30; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key30 UNIQUE (name);


--
-- Name: products products_name_key31; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key31 UNIQUE (name);


--
-- Name: products products_name_key32; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key32 UNIQUE (name);


--
-- Name: products products_name_key33; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key33 UNIQUE (name);


--
-- Name: products products_name_key34; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key34 UNIQUE (name);


--
-- Name: products products_name_key35; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key35 UNIQUE (name);


--
-- Name: products products_name_key36; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key36 UNIQUE (name);


--
-- Name: products products_name_key37; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key37 UNIQUE (name);


--
-- Name: products products_name_key38; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key38 UNIQUE (name);


--
-- Name: products products_name_key39; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key39 UNIQUE (name);


--
-- Name: products products_name_key4; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key4 UNIQUE (name);


--
-- Name: products products_name_key40; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key40 UNIQUE (name);


--
-- Name: products products_name_key41; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key41 UNIQUE (name);


--
-- Name: products products_name_key42; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key42 UNIQUE (name);


--
-- Name: products products_name_key43; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key43 UNIQUE (name);


--
-- Name: products products_name_key44; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key44 UNIQUE (name);


--
-- Name: products products_name_key45; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key45 UNIQUE (name);


--
-- Name: products products_name_key46; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key46 UNIQUE (name);


--
-- Name: products products_name_key47; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key47 UNIQUE (name);


--
-- Name: products products_name_key48; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key48 UNIQUE (name);


--
-- Name: products products_name_key49; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key49 UNIQUE (name);


--
-- Name: products products_name_key5; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key5 UNIQUE (name);


--
-- Name: products products_name_key50; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key50 UNIQUE (name);


--
-- Name: products products_name_key51; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key51 UNIQUE (name);


--
-- Name: products products_name_key52; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key52 UNIQUE (name);


--
-- Name: products products_name_key53; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key53 UNIQUE (name);


--
-- Name: products products_name_key54; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key54 UNIQUE (name);


--
-- Name: products products_name_key55; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key55 UNIQUE (name);


--
-- Name: products products_name_key56; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key56 UNIQUE (name);


--
-- Name: products products_name_key57; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key57 UNIQUE (name);


--
-- Name: products products_name_key58; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key58 UNIQUE (name);


--
-- Name: products products_name_key59; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key59 UNIQUE (name);


--
-- Name: products products_name_key6; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key6 UNIQUE (name);


--
-- Name: products products_name_key60; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key60 UNIQUE (name);


--
-- Name: products products_name_key7; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key7 UNIQUE (name);


--
-- Name: products products_name_key8; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key8 UNIQUE (name);


--
-- Name: products products_name_key9; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_name_key9 UNIQUE (name);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_name_key; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key UNIQUE (name);


--
-- Name: suppliers suppliers_name_key1; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key1 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key10; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key10 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key11; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key11 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key12; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key12 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key13; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key13 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key14; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key14 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key15; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key15 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key16; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key16 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key17; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key17 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key18; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key18 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key19; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key19 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key2; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key2 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key20; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key20 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key21; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key21 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key22; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key22 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key23; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key23 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key24; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key24 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key25; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key25 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key26; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key26 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key27; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key27 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key28; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key28 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key29; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key29 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key3; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key3 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key30; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key30 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key31; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key31 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key32; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key32 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key33; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key33 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key34; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key34 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key35; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key35 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key36; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key36 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key37; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key37 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key38; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key38 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key39; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key39 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key4; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key4 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key40; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key40 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key41; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key41 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key42; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key42 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key43; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key43 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key44; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key44 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key45; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key45 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key46; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key46 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key47; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key47 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key48; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key48 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key49; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key49 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key5; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key5 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key50; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key50 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key51; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key51 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key52; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key52 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key53; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key53 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key54; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key54 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key55; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key55 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key56; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key56 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key57; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key57 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key58; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key58 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key59; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key59 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key6; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key6 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key60; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key60 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key61; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key61 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key7; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key7 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key8; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key8 UNIQUE (name);


--
-- Name: suppliers suppliers_name_key9; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_name_key9 UNIQUE (name);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_rut_key; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key1; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key1 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key10; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key10 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key11; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key11 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key12; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key12 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key13; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key13 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key14; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key14 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key15; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key15 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key16; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key16 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key17; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key17 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key18; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key18 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key19; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key19 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key2; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key2 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key20; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key20 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key21; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key21 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key22; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key22 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key23; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key23 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key24; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key24 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key25; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key25 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key26; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key26 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key27; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key27 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key28; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key28 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key29; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key29 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key3; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key3 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key30; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key30 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key31; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key31 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key32; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key32 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key33; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key33 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key34; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key34 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key35; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key35 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key36; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key36 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key37; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key37 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key38; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key38 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key39; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key39 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key4; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key4 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key40; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key40 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key41; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key41 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key42; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key42 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key43; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key43 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key44; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key44 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key45; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key45 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key46; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key46 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key47; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key47 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key48; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key48 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key49; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key49 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key5; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key5 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key50; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key50 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key51; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key51 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key52; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key52 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key53; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key53 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key54; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key54 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key55; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key55 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key56; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key56 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key57; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key57 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key58; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key58 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key59; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key59 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key6; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key6 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key60; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key60 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key61; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key61 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key7; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key7 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key8; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key8 UNIQUE (rut);


--
-- Name: suppliers suppliers_rut_key9; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.suppliers
    ADD CONSTRAINT suppliers_rut_key9 UNIQUE (rut);


--
-- Name: order_products unique_order_product; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT unique_order_product UNIQUE (order_id, product_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: categories_created_at; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX categories_created_at ON inventpro_user.categories USING btree (created_at);


--
-- Name: clients_created_at; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX clients_created_at ON inventpro_user.clients USING btree (created_at);


--
-- Name: clients_created_at_desc_idx; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX clients_created_at_desc_idx ON inventpro_user.clients USING btree (created_at DESC) WHERE (deleted_at IS NULL);


--
-- Name: clients_email_unique_active; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE UNIQUE INDEX clients_email_unique_active ON inventpro_user.clients USING btree (email) WHERE (deleted_at IS NULL);


--
-- Name: clients_name; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX clients_name ON inventpro_user.clients USING btree (name);


--
-- Name: clients_name_lower_idx; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX clients_name_lower_idx ON inventpro_user.clients USING btree (lower((name)::text));


--
-- Name: clients_rut_lower_idx; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX clients_rut_lower_idx ON inventpro_user.clients USING btree (lower((rut)::text));


--
-- Name: clients_rut_unique_active; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE UNIQUE INDEX clients_rut_unique_active ON inventpro_user.clients USING btree (rut) WHERE (deleted_at IS NULL);


--
-- Name: manual_inv_product_id_idx; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX manual_inv_product_id_idx ON inventpro_user.manual_inventories USING btree (product_id);


--
-- Name: manual_inv_user_id_idx; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX manual_inv_user_id_idx ON inventpro_user.manual_inventories USING btree (user_id);


--
-- Name: manual_inventories_created_at; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX manual_inventories_created_at ON inventpro_user.manual_inventories USING btree (created_at);


--
-- Name: manual_inventories_product_id; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX manual_inventories_product_id ON inventpro_user.manual_inventories USING btree (product_id);


--
-- Name: manual_inventories_type; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX manual_inventories_type ON inventpro_user.manual_inventories USING btree (type);


--
-- Name: manual_inventories_user_id; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX manual_inventories_user_id ON inventpro_user.manual_inventories USING btree (user_id);


--
-- Name: order_products_order_id_idx; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX order_products_order_id_idx ON inventpro_user.order_products USING btree (order_id);


--
-- Name: order_products_order_id_product_id_uq; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE UNIQUE INDEX order_products_order_id_product_id_uq ON inventpro_user.order_products USING btree (order_id, product_id);


--
-- Name: order_products_product_id_idx; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX order_products_product_id_idx ON inventpro_user.order_products USING btree (product_id);


--
-- Name: orders_client_id; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX orders_client_id ON inventpro_user.orders USING btree (client_id);


--
-- Name: orders_client_id_idx; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX orders_client_id_idx ON inventpro_user.orders USING btree (client_id);


--
-- Name: orders_created_at; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX orders_created_at ON inventpro_user.orders USING btree (created_at);


--
-- Name: orders_created_at_idx; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX orders_created_at_idx ON inventpro_user.orders USING btree (created_at);


--
-- Name: orders_is_backorder; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX orders_is_backorder ON inventpro_user.orders USING btree (is_backorder);


--
-- Name: orders_is_backorder_idx; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX orders_is_backorder_idx ON inventpro_user.orders USING btree (is_backorder);


--
-- Name: orders_status; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX orders_status ON inventpro_user.orders USING btree (status);


--
-- Name: orders_status_idx; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX orders_status_idx ON inventpro_user.orders USING btree (status);


--
-- Name: products_category_id_idx; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX products_category_id_idx ON inventpro_user.products USING btree (category_id);


--
-- Name: products_name; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE UNIQUE INDEX products_name ON inventpro_user.products USING btree (name);


--
-- Name: products_price; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX products_price ON inventpro_user.products USING btree (price);


--
-- Name: products_stock; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX products_stock ON inventpro_user.products USING btree (stock);


--
-- Name: products_supplier_id_idx; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX products_supplier_id_idx ON inventpro_user.products USING btree (supplier_id);


--
-- Name: reports_created_at; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX reports_created_at ON inventpro_user.reports USING btree (created_at);


--
-- Name: reports_created_by; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX reports_created_by ON inventpro_user.reports USING btree (created_by);


--
-- Name: reports_created_by_idx; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX reports_created_by_idx ON inventpro_user.reports USING btree (created_by);


--
-- Name: reports_format; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX reports_format ON inventpro_user.reports USING btree (format);


--
-- Name: reports_status; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX reports_status ON inventpro_user.reports USING btree (status);


--
-- Name: suppliers_name; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE UNIQUE INDEX suppliers_name ON inventpro_user.suppliers USING btree (name);


--
-- Name: suppliers_name_lower_idx; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX suppliers_name_lower_idx ON inventpro_user.suppliers USING btree (lower((name)::text));


--
-- Name: suppliers_rut; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE UNIQUE INDEX suppliers_rut ON inventpro_user.suppliers USING btree (rut);


--
-- Name: suppliers_rut_lower_idx; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX suppliers_rut_lower_idx ON inventpro_user.suppliers USING btree (lower((rut)::text));


--
-- Name: suppliers_status; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX suppliers_status ON inventpro_user.suppliers USING btree (status);


--
-- Name: suppliers_status_idx; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX suppliers_status_idx ON inventpro_user.suppliers USING btree (status);


--
-- Name: users_email; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE UNIQUE INDEX users_email ON inventpro_user.users USING btree (email);


--
-- Name: users_role; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE INDEX users_role ON inventpro_user.users USING btree (role);


--
-- Name: users_username; Type: INDEX; Schema: inventpro_user; Owner: inventpro_user
--

CREATE UNIQUE INDEX users_username ON inventpro_user.users USING btree (username);


--
-- Name: order_products trg_lock_order_products; Type: TRIGGER; Schema: inventpro_user; Owner: inventpro_user
--

CREATE TRIGGER trg_lock_order_products BEFORE UPDATE ON inventpro_user.order_products FOR EACH ROW EXECUTE FUNCTION inventpro_user.prevent_order_product_mods();


--
-- Name: SupplierCategories SupplierCategories_category_id_fkey; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user."SupplierCategories"
    ADD CONSTRAINT "SupplierCategories_category_id_fkey" FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SupplierCategories SupplierCategories_supplier_id_fkey; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user."SupplierCategories"
    ADD CONSTRAINT "SupplierCategories_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey1; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey1 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey10; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey10 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey11; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey11 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey12; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey12 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey13; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey13 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey14; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey14 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey15; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey15 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey16; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey16 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey17; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey17 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey18; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey18 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey19; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey19 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey2; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey2 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey20; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey20 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey21; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey21 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey22; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey22 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey23; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey23 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey24; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey24 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey25; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey25 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey26; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey26 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey27; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey27 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey28; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey28 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey29; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey29 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey3; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey3 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey30; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey30 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey31; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey31 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey32; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey32 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey33; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey33 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey34; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey34 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey35; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey35 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey36; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey36 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey37; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey37 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey38; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey38 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey39; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey39 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey4; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey4 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey40; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey40 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey41; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey41 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey42; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey42 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey43; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey43 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey44; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey44 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey45; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey45 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey46; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey46 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey47; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey47 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey48; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey48 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey49; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey49 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey5; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey5 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey50; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey50 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey51; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey51 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey52; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey52 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey53; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey53 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey54; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey54 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey55; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey55 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey6; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey6 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey7; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey7 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey8; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey8 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_product_id_fkey9; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_product_id_fkey9 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey1; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey1 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey10; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey10 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey11; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey11 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey12; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey12 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey13; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey13 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey14; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey14 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey15; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey15 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey16; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey16 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey17; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey17 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey18; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey18 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey19; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey19 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey2; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey2 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey20; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey20 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey21; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey21 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey22; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey22 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey23; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey23 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey24; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey24 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey25; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey25 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey26; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey26 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey27; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey27 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey28; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey28 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey29; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey29 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey3; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey3 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey30; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey30 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey31; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey31 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey32; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey32 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey33; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey33 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey34; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey34 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey35; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey35 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey36; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey36 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey37; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey37 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey38; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey38 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey39; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey39 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey4; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey4 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey40; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey40 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey41; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey41 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey42; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey42 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey43; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey43 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey44; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey44 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey45; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey45 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey46; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey46 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey47; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey47 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey48; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey48 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey49; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey49 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey5; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey5 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey50; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey50 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey51; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey51 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey52; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey52 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey53; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey53 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey54; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey54 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey6; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey6 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey7; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey7 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey8; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey8 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: manual_inventories manual_inventories_user_id_fkey9; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.manual_inventories
    ADD CONSTRAINT manual_inventories_user_id_fkey9 FOREIGN KEY (user_id) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: order_products order_products_order_id_fkey; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey1; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey1 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey10; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey10 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey11; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey11 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey12; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey12 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey13; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey13 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey14; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey14 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey15; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey15 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey16; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey16 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey17; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey17 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey18; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey18 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey19; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey19 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey2; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey2 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey20; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey20 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey21; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey21 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey22; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey22 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey23; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey23 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey24; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey24 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey25; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey25 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey26; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey26 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey27; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey27 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey28; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey28 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey29; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey29 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey3; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey3 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey30; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey30 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey31; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey31 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey32; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey32 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey33; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey33 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey34; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey34 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey35; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey35 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey36; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey36 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey37; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey37 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey38; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey38 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey39; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey39 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey4; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey4 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey40; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey40 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey41; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey41 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey42; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey42 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey43; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey43 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey44; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey44 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey45; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey45 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey46; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey46 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey47; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey47 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey48; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey48 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey49; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey49 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey5; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey5 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey50; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey50 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey51; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey51 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey52; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey52 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey53; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey53 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey54; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey54 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey55; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey55 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey6; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey6 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey7; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey7 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey8; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey8 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_order_id_fkey9; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_order_id_fkey9 FOREIGN KEY (order_id) REFERENCES inventpro_user.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: order_products order_products_product_id_fkey1; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey1 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey10; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey10 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey11; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey11 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey12; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey12 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey13; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey13 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey14; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey14 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey15; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey15 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey16; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey16 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey17; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey17 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey18; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey18 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey19; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey19 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey2; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey2 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey20; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey20 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey21; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey21 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey22; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey22 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey23; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey23 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey24; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey24 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey25; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey25 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey26; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey26 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey27; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey27 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey28; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey28 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey29; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey29 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey3; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey3 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey30; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey30 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey31; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey31 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey32; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey32 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey33; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey33 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey34; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey34 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey35; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey35 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey36; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey36 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey37; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey37 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey38; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey38 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey39; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey39 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey4; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey4 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey40; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey40 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey41; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey41 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey42; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey42 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey43; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey43 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey44; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey44 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey45; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey45 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey46; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey46 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey47; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey47 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey48; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey48 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey49; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey49 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey5; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey5 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey50; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey50 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey51; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey51 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey52; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey52 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey53; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey53 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey54; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey54 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey55; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey55 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey6; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey6 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey7; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey7 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey8; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey8 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_products order_products_product_id_fkey9; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.order_products
    ADD CONSTRAINT order_products_product_id_fkey9 FOREIGN KEY (product_id) REFERENCES inventpro_user.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: orders orders_client_id_fkey; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.orders
    ADD CONSTRAINT orders_client_id_fkey FOREIGN KEY (client_id) REFERENCES inventpro_user.clients(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey1; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey1 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey10; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey10 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey11; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey11 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey12; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey12 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey13; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey13 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey14; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey14 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey15; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey15 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey16; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey16 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey17; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey17 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey18; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey18 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey19; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey19 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey2; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey2 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey20; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey20 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey21; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey21 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey22; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey22 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey23; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey23 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey24; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey24 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey25; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey25 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey26; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey26 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey27; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey27 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey28; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey28 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey29; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey29 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey3; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey3 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey30; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey30 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey31; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey31 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey32; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey32 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey33; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey33 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey34; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey34 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey35; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey35 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey36; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey36 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey37; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey37 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey38; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey38 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey39; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey39 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey4; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey4 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey40; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey40 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey41; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey41 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey42; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey42 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey43; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey43 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey44; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey44 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey45; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey45 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey46; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey46 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey47; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey47 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey48; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey48 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey49; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey49 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey5; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey5 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey50; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey50 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey51; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey51 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey52; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey52 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey53; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey53 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey54; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey54 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey55; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey55 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey56; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey56 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey57; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey57 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey58; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey58 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey59; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey59 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey6; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey6 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey60; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey60 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey7; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey7 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey8; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey8 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey9; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_category_id_fkey9 FOREIGN KEY (category_id) REFERENCES inventpro_user.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey1; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey1 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey10; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey10 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey11; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey11 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey12; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey12 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey13; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey13 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey14; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey14 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey15; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey15 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey16; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey16 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey17; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey17 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey18; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey18 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey19; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey19 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey2; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey2 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey20; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey20 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey21; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey21 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey22; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey22 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey23; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey23 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey24; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey24 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey25; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey25 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey26; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey26 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey27; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey27 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey28; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey28 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey29; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey29 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey3; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey3 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey30; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey30 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey31; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey31 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey32; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey32 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey33; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey33 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey34; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey34 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey35; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey35 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey36; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey36 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey37; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey37 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey38; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey38 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey39; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey39 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey4; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey4 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey40; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey40 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey41; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey41 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey42; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey42 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey43; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey43 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey44; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey44 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey45; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey45 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey46; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey46 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey47; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey47 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey48; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey48 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey49; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey49 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey5; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey5 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey50; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey50 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey51; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey51 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey52; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey52 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey53; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey53 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey54; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey54 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey55; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey55 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey56; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey56 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey57; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey57 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey58; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey58 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey59; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey59 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey6; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey6 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey60; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey60 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey7; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey7 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey8; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey8 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: products products_supplier_id_fkey9; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.products
    ADD CONSTRAINT products_supplier_id_fkey9 FOREIGN KEY (supplier_id) REFERENCES inventpro_user.suppliers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reports reports_created_by_fkey; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey1; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey1 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey10; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey10 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey11; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey11 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey12; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey12 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey13; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey13 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey14; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey14 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey15; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey15 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey16; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey16 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey17; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey17 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey18; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey18 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey19; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey19 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey2; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey2 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey20; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey20 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey21; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey21 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey22; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey22 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey23; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey23 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey24; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey24 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey25; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey25 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey26; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey26 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey27; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey27 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey28; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey28 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey29; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey29 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey3; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey3 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey30; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey30 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey31; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey31 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey32; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey32 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey33; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey33 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey34; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey34 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey35; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey35 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey36; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey36 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey37; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey37 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey38; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey38 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey39; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey39 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey4; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey4 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey40; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey40 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey41; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey41 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey42; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey42 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey43; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey43 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey44; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey44 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey45; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey45 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey46; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey46 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey47; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey47 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey48; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey48 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey49; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey49 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey5; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey5 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey50; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey50 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey51; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey51 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey52; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey52 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey53; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey53 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey54; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey54 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey6; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey6 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey7; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey7 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey8; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey8 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- Name: reports reports_created_by_fkey9; Type: FK CONSTRAINT; Schema: inventpro_user; Owner: inventpro_user
--

ALTER TABLE ONLY inventpro_user.reports
    ADD CONSTRAINT reports_created_by_fkey9 FOREIGN KEY (created_by) REFERENCES inventpro_user.users(id) ON UPDATE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 1c3TwEiAcea2pBR9mAqbkdb9a3VDPxg8QPviwsucOEOweZg9e5AxjH303WC2or1

