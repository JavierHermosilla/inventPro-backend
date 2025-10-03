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
 *       required: [clientId, items]
 *       properties:
 *         clientId: { type: string, format: uuid, description: "Cliente dueño de la orden" }
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/OrderItemInput' }
 *         notes: { type: string }
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
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, processing, completed, cancelled] }
 *       - in: query
 *         name: clientId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Lista de órdenes }
 *   post:
 *     tags: [Orders]
 *     summary: Crear una orden (permite backorder)
 *     description: >
 *       El sistema permite stock negativo; si una orden deja stock < 0, se marca `isBackorder=true`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/OrderCreateInput' }
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
 *   put:
 *     tags: [Orders]
 *     summary: Actualizar orden (estado, notas)
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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

/**
 * @swagger
 * /orders/{id}/items:
 *   post:
 *     tags: [Orders]
 *     summary: Agregar/merge items en orden
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items: { $ref: '#/components/schemas/OrderItemInput' }
 *     responses:
 *       200: { description: Ítems agregados/actualizados }
 */

/**
 * @swagger
 * /orders/{id}/items/{itemId}:
 *   put:
 *     tags: [Orders]
 *     summary: Actualizar cantidad de un ítem por delta
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [delta]
 *             properties:
 *               delta: { type: integer, description: "positivo o negativo" }
 *     responses:
 *       200: { description: Ítem actualizado }
 *   delete:
 *     tags: [Orders]
 *     summary: Eliminar ítem de la orden (ajusta totales/stock)
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Ítem eliminado }
 */
