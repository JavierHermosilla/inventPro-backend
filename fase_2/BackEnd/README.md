InventPro

Sistema de gestión de inventarios y órdenes de compra con panel administrativo para PyMEs

Tabla de Contenidos

- Descripción

- Tecnologías

- Requisitos

- Instalación

- Configuración de PostgreSQL

- Variables de Entorno

- Ejecución

- Migraciones y Seeds

- Pruebas

- Swagger API

- Rutas y Ejemplos

- Estructura de Proyecto

- Licencia

Descripción

InventPro es un backend REST API para gestionar inventarios, órdenes de compra, usuarios y roles. Incluye:

- Autenticación JWT

- Control de roles (admin, bodeguero, user)

- Auditoría de IP

- Seguridad con Helmet y XSS-clean

- Logging con Winston

- Documentación Swagger

Tecnologías

- Node.js (ES Modules)

- Express.js

- PostgreSQL

- Sequelize ORM

- JWT

- Winston

- Swagger

- Jest y Supertest

Requisitos

- Node.js >= 20.x

- npm >= 9.x

- PostgreSQL >= 15.x

Instalación

1. Clonar el repositorio:

git clone https://github.com/JavierHermosilla/inventpro.git
cd inventpro


2. Instalar dependencias:

npm install


3. Crear archivo .env en la raíz:

JWT_SECRET="j^Cs>Q_68MFGi8t:WgG@qR@t6eFVw^LR>WD"
PORT=3000
DB_NAME=inventpro
DB_USER=inventpro_user
DB_PASSWORD=ADMIN
DB_HOST=localhost
DB_PORT=5432

* Configuración de PostgreSQL

1. Instalar PostgreSQL:

- Windows: https://www.postgresql.org/download/windows/

- macOS: brew install postgresql

- Linux: sudo apt install postgresql postgresql-contrib

2. Iniciar el servicio de PostgreSQL:

# Linux
sudo service postgresql start

# macOS
brew services start postgresql


3. Crear usuario y base de datos:

psql -U postgres

CREATE USER inventpro_user WITH PASSWORD 'ADMIN';
CREATE DATABASE inventpro OWNER inventpro_user;
GRANT ALL PRIVILEGES ON DATABASE inventpro TO inventpro_user;


4. Verificar conexión:

psql -U inventpro_user -d inventpro -h localhost -W

Variables de Entorno
Variable	Descripción
JWT_SECRET:	Clave secreta para JWT
PORT:	Puerto del servidor
DB_NAME:	Base de datos PostgreSQL
DB_USER:	Usuario de PostgreSQL
DB_PASSWORD:	Contraseña del usuario PostgreSQL
DB_HOST:	Host de PostgreSQL (localhost)
DB_PORT:	Puerto de PostgreSQL (5432)

Ejecución
- Desarrollo:
npm run dev

- Producción:
npm start

Confirmación:
>>> PostgreSQL connected successfully!
Server running on port 3000

Migraciones y Seeds

Sequelize se usa para sincronizar modelos y gestionar datos iniciales.

1. Sincronizar tablas automáticamente (desarrollo):

// src/config/db.js
await sequelize.sync({ alter: true }) // Crea/actualiza tablas según modelos


2. Seeds iniciales:

- Crear archivo src/seeds/initialUsers.js:

import User from '../models/user.model.js'
import bcrypt from 'bcryptjs'

const seedUsers = async () => {
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await User.create({
    username: 'admin',
    name: 'Administrador',
    email: 'admin@inventpro.com',
    password: hashedPassword,
    role: 'admin'
  })
}
export default seedUsers


- Ejecutar seeds al iniciar:

import seedUsers from './seeds/initialUsers.js'
await seedUsers()

- Pruebas

Ejecutar tests unitarios:

npm test

- Swagger API

Documentación accesible en:

http://localhost:3000/api-docs

*** Ejemplo creación de usuario ***

POST /api/users
Content-Type: application/json
Authorization: Bearer <JWT>

{
  "username": "bodeguero1",
  "name": "bodeguero Uno",
  "email": "bodeguero1@inventpro.com",
  "password": "bodeguero123",
  "role": "bodeguero"
}


*** Respuesta ***

{
  "message": "Usuario creado",
  "user": {
    "id": "uuid",
    "username": "bodeguero1",
    "name": "bodeguero Uno",
    "email": "bodeguero1@inventpro.com",
    "role": "bodeguero"
  }
}

Orders, Products, Suppliers, Manual Inventory y Categories

Se siguen esquemas similares con autenticación JWT y validación de roles.

Estructura de Proyecto
inventpro/
├─ src/
│  ├─ config/
│  │  ├─ db.js
│  │  └─ swagger.js
│  ├─ controllers/
│  │  └─ *.controller.js
│  ├─ middleware/
│  │  └─ *.middleware.js
│  ├─ models/
│  │  └─ *.model.js
│  ├─ routes/
│  │  └─ *.routes.js
│  ├─ schemas/
│  │  └─ *.schema.js
│  ├─ seeds/
│  │  └─ *.js
│  ├─ utils/
│  │  └─ logger.js
│  ├─ libs/
│  │  └─ jwt.js
│  └─ app.js
├─ .env
├─ package.json
└─ README.md

Licencia

MIT © InventPro