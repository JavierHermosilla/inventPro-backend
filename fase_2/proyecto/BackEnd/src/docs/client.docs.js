/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: Gestión de clientes (incluye RUT chileno)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       properties:
 *         id:     { type: string, format: uuid }
 *         name:   { type: string }
 *         rut:    { type: string, example: "12.345.678-5" }
 *         email:  { type: string, format: email, nullable: true }
 *         phone:  { type: string, nullable: true }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CreateClientInput:
 *       type: object
 *       required: [name, rut]
 *       properties:
 *         name:  { type: string }
 *         rut:   { type: string, description: "RUT válido" }
 *         email: { type: string, format: email }
 *         phone: { type: string }
 */

/**
 * @swagger
 * /clients:
 *   get:
 *     tags: [Clients]
 *     summary: Listar clientes
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de clientes
 *   post:
 *     tags: [Clients]
 *     summary: Crear cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateClientInput' }
 *     responses:
 *       201:
 *         description: Cliente creado
 */

/**
 * @swagger
 * /clients/{id}:
 *   get:
 *     tags: [Clients]
 *     summary: Obtener cliente
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *     responses:
 *       200:
 *         description: Cliente
 *       404:
 *         description: No encontrado
 *   put:
 *     tags: [Clients]
 *     summary: Actualizar cliente
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateClientInput' }
 *     responses:
 *       200:
 *         description: Actualizado
 *   delete:
 *     tags: [Clients]
 *     summary: Eliminar cliente
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *     responses:
 *       204:
 *         description: Eliminado
 */
