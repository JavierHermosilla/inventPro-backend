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
 *         rut:    { type: string, example: "12345678-5" }
 *         email:  { type: string, format: email }
 *         phone:  { type: string, example: "+56912345678" }
 *         address:{ type: string, example: "Av. Libertador 1234, Santiago" }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CreateClientInput:
 *       type: object
 *       required: [name, rut, email, phone, address]
 *       properties:
 *         name:  { type: string, example: "Cliente Demo" }
 *         rut:   { type: string, description: "RUT válido sin puntos", example: "12345678-5" }
 *         email: { type: string, format: email, example: "cliente.demo@example.com" }
 *         phone: { type: string, example: "+56912345678" }
 *         address: { type: string, example: "Av. Siempre Viva 742" }
 *         avatar: { type: string, format: uri, example: "https://cdn.inventpro.cl/avatars/demo.png" }
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
 *         schema: { type: string, example: "Fabricio" }
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
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CreateClientInput'
 *             example:
 *               name: "Cliente Demo"
 *               rut: "12345678-5"
 *               email: "cliente.demo@example.com"
 *               phone: "+56912345678"
 *               address: "Av. Siempre Viva 742"
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
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CreateClientInput'
 *             example:
 *               name: "Cliente Actualizado"
 *               rut: "12345678-5"
 *               email: "cliente@example.com"
 *               phone: "+56912345678"
 *               address: "Nueva dirección 123"
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
