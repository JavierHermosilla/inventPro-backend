/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios (RBAC)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:    { type: string, format: uuid }
 *         name:  { type: string }
 *         email: { type: string, format: email }
 *         role:  { type: string, enum: [admin, vendedor, bodeguero] }
 *         phone: { type: string, nullable: true }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CreateUserInput:
 *       type: object
 *       required: [name, email, password, role]
 *       properties:
 *         name:  { type: string }
 *         email: { type: string, format: email }
 *         password:
 *           type: string
 *           minLength: 8
 *           description: "Política fuerte (8+, mayúscula, minúscula, número y símbolo)"
 *         role:  { type: string, enum: [admin, vendedor, bodeguero] }
 *         phone: { type: string }
 */

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Listar usuarios (paginado)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *   post:
 *     tags: [Users]
 *     summary: Crear usuario (admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateUserInput' }
 *     responses:
 *       201:
 *         description: Usuario creado
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Obtener usuario por id
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *     responses:
 *       200:
 *         description: Usuario
 *       404:
 *         description: No encontrado
 *   put:
 *     tags: [Users]
 *     summary: Actualizar usuario (admin o self con restricciones)
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *   delete:
 *     tags: [Users]
 *     summary: Eliminar usuario (admin)
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *     responses:
 *       204:
 *         description: Eliminado
 */
