/**
 * @swagger
 * tags:
 *   name: OrderProducts
 *   description: Ítems asociados a una orden (tabla order_products)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderProduct:
 *       type: object
 *       properties:
 *         id:        { type: string, format: uuid }
 *         orderId:   { type: string, format: uuid }
 *         productId: { type: string, format: uuid }
 *         quantity:  { type: integer }
 *         price:     { type: number, format: float }
 *         created_at:{ type: string, format: date-time }
 *         updated_at:{ type: string, format: date-time }
 *     OrderProductCreateInput:
 *       type: object
 *       required: [orderId, productId, quantity]
 *       properties:
 *         orderId:   { type: string, format: uuid }
 *         productId: { type: string, format: uuid }
 *         quantity:  { type: integer, minimum: 1, example: 2 }
 *     OrderProductUpdateInput:
 *       type: object
 *       required: [quantity]
 *       properties:
 *         quantity: { type: integer, minimum: 0, example: 5 }
 */

/**
 * @swagger
 * /order-products:
 *   get:
 *     tags: [OrderProducts]
 *     summary: Listar ítems de órdenes
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
 *       - in: query
 *         name: orderId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: productId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Lista paginada de ítems
 *   post:
 *     tags: [OrderProducts]
 *     summary: Crear un ítem dentro de una orden existente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/OrderProductCreateInput'
 *             example:
 *               orderId: "5ea4257f-76df-4f07-858f-c2921a033db2"
 *               productId: "135cfe80-cdec-42e3-b92a-5faea86ecf14"
 *               quantity: 3
 *     responses:
 *       201:
 *         description: Ítem creado
 */

/**
 * @swagger
 * /order-products/{id}:
 *   get:
 *     tags: [OrderProducts]
 *     summary: Obtener un ítem por id
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *     responses:
 *       200: { description: Ítem }
 *       404: { description: No encontrado }
 *   patch:
 *     tags: [OrderProducts]
 *     summary: Actualizar la cantidad del ítem
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderProductUpdateInput'
 *     responses:
 *       200: { description: Ítem actualizado }
 *   delete:
 *     tags: [OrderProducts]
 *     summary: Eliminar un ítem (restaura stock del producto)
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *     responses:
 *       204: { description: Ítem eliminado }
 */
