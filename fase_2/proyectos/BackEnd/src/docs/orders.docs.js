/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Gestión de órdenes (permite backorder)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItemInput:
 *       type: object
 *       required: [productId, quantity]
 *       properties:
 *         productId: { type: string, format: uuid }
 *         quantity:  { type: integer, minimum: 1 }
 *     OrderCreateInput:
 *       type: object
 *       required: [products]
 *       properties:
 *         clientId: { type: string, format: uuid, description: "Cliente dueño de la orden (exclusivo con rut)" }
 *         rut: { type: string, description: "Alternativa al clientId, acepta RUT chileno válido", example: "12345678-5" }
 *         products:
 *           type: array
 *           minItems: 1
 *           maxItems: 100
 *           items: { $ref: '#/components/schemas/OrderItemInput' }
 *         notes: { type: string, maxLength: 500 }
 *         reference: { type: string, maxLength: 100, example: "OC-1234" }
 *         channel: { type: string, enum: [web, pos, api], example: "api" }
 *     Order:
 *       type: object
 *       properties:
 *         id:          { type: string, format: uuid }
 *         clientId:    { type: string, format: uuid }
 *         status:      { type: string, enum: [pending, processing, completed, cancelled] }
 *         totalAmount: { type: number, format: float }
 *         isBackorder: { type: boolean, description: "true si alguna línea dejó stock < 0" }
 *         createdAt:   { type: string, format: date-time }
 *         updatedAt:   { type: string, format: date-time }
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: Listar órdenes (paginado y filtros)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, example: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, processing, completed, cancelled], example: "processing" }
 *       - in: query
 *         name: clientId
 *         schema: { type: string, format: uuid, example: "0e9e6f02-5a8e-4055-955e-c5b704d73fb0" }
 *     responses:
 *       200: { description: Lista de órdenes }
 *   post:
 *     tags: [Orders]
 *     summary: Crear una orden (permite backorder)
 *     description: >
 *       El sistema permite stock negativo; si una orden deja stock < 0, se marca `isBackorder=true`.
 *       Debes enviar **exactamente uno** de `clientId` o `rut` y al menos un producto.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/OrderCreateInput'
 *             example:
 *               clientId: "0e9e6f02-5a8e-4055-955e-c5b704d73fb0"
 *               products:
 *                 - productId: "135cfe80-cdec-42e3-b92a-5faea86ecf14"
 *                   quantity: 2
 *                 - productId: "2a1e5ec9-0a32-4749-8a07-9b4e9fc515a6"
 *                   quantity: 1
 *               notes: "Pedido online"
 *               reference: "OC-1234"
 *               channel: "api"
 *     responses:
 *       201:
 *         description: Orden creada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Order' }
 */

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Obtener orden por id
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *     responses:
 *       200: { description: Orden }
 *       404: { description: No encontrada }
 *   patch:
 *     tags: [Orders]
 *     summary: Actualizar estado de la orden
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [pending, processing, completed, cancelled], example: "processing" }
 *     responses:
 *       200: { description: Orden actualizada }
 *   delete:
 *     tags: [Orders]
 *     summary: Eliminar orden (restaura stock)
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *     responses:
 *       204: { description: Eliminada }
 */
