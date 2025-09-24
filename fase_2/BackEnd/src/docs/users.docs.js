/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:        { type: string, example: "1a2b3c4d-5e6f-7081-92ab-3c4d5e6f7081" }
 *         username:  { type: string, example: "johndoe" }
 *         name:      { type: string, example: "John Doe" }
 *         email:     { type: string, format: email, example: "johndoe@example.com" }
 *         phone:     { type: string, example: "+56912345678" }
 *         address:   { type: string, example: "123 Main St" }
 *         avatar:    { type: string, format: uri, example: "https://example.com/avatar.jpg" }
 *         role:      { type: string, enum: [admin, user, vendedor], example: "user" }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *
 *     UserInput:
 *       type: object
 *       required: [username, name, email, password, phone]
 *       properties:
 *         username: { type: string, example: "johndoe" }
 *         name:     { type: string, example: "John Doe" }
 *         email:    { type: string, format: email, example: "johndoe@example.com" }
 *         password: { type: string, format: password, writeOnly: true, example: "secret123" }
 *         phone:    { type: string, example: "+56912345678" }
 *         address:  { type: string, example: "123 Main St" }
 *         avatar:   { type: string, format: uri, example: "https://example.com/avatar.jpg" }
 *         role:     { type: string, enum: [admin, user, vendedor], example: "user" }
 *
 *     UserUpdate:
 *       type: object
 *       properties:
 *         username: { type: string }
 *         name:     { type: string }
 *         email:    { type: string, format: email }
 *         phone:    { type: string }
 *         address:  { type: string }
 *         avatar:   { type: string, format: uri }
 *         role:     { type: string, enum: [admin, user, vendedor] }
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create user
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     description: Solo **admin**.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/UserInput" }
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Usuario creado correctamente" }
 *                 user:    { $ref: "#/components/schemas/User" }
 *       400: { description: Datos inválidos }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       409: { description: Username o email ya existe }
 *
 *   get:
 *     summary: List users (paginated)
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Búsqueda por nombre/username/email (ILIKE)
 *     responses:
 *       200:
 *         description: Paged list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:  { type: integer, example: 12 }
 *                 page:   { type: integer, example: 1 }
 *                 pages:  { type: integer, example: 2 }
 *                 users:
 *                   type: array
 *                   items: { $ref: "#/components/schemas/User" }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }   # usa format: uuid si corresponde
 *     responses:
 *       200:
 *         description: User
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/User" }
 *       404: { description: Usuario no encontrado }
 *       401: { description: Unauthorized }
 *
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     description: Solo **admin** (o el propio usuario si tu lógica lo permite).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/UserUpdate" }
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Usuario actualizado correctamente" }
 *                 user:    { $ref: "#/components/schemas/User" }
 *       400: { description: Datos inválidos }
 *       404: { description: Usuario no encontrado }
 *       401: { description: Unauthorized }
 *       409: { description: Username o email ya en uso por otro usuario }
 *
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security: [ { bearerAuth: [] } ]
 *     description: Solo **admin**. Soft delete si tu modelo lo soporta.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Mensaje de eliminación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Usuario eliminado correctamente" }
 *       404: { description: Usuario no encontrado }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
