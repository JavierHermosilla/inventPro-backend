/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order creation, listing and management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       properties:
 *         productId: { type: string, format: uuid, example: "6a3d4f5b-1234-4f8d-99aa-0abc12de34f5" }
 *         quantity:  { type: integer, example: 2 }
 *         price:     { type: number, format: float, example: 12990.00, description: "Precio copiado del Product en el momento del pedido" }
 *     Order:
 *       type: object
 *       properties:
 *         id:            { type: string, format: uuid }
 *         customerId:    { type: string, format: uuid }
 *         status:        { type: string, enum: ["pending","processing","completed","cancelled"], example: "pending" }
 *         totalAmount:   { type: number, format: float, example: 25980.00 }
 *         isBackorder:   { type: boolean, example: false }
 *         stockRestored: { type: boolean, example: false }
 *         createdAt:     { type: string, format: date-time }
 *         updatedAt:     { type: string, format: date-time }
 *         orderItems:
 *           type: array
 *           items: { $ref: "#/components/schemas/OrderItem" }
 *     OrderCreateInput:
 *       type: object
 *       required: [customerId, products]
 *       properties:
 *         customerId: { type: string, format: uuid }
 *         products:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId: { type: string, format: uuid }
 *               quantity:  { type: integer, minimum: 1, example: 2 }
 *       example:
 *         customerId: "7b9f0e3c-7f32-4d0e-8a23-2a9a1f1e2a3b"
 *         products:
 *           - productId: "6a3d4f5b-1234-4f8d-99aa-0abc12de34f5"
 *             quantity: 1
 *           - productId: "b3c4d5e6-7890-4a1b-8c2d-3e4f5a6b7c8d"
 *             quantity: 2
 *     OrderStatusUpdate:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: ["pending","processing","completed","cancelled"]
 *           example: "processing"
 *     OrderCreateByRutInput:
 *       type: object
 *       required: [rut, products]
 *       properties:
 *         rut: { type: string, example: "12.345.678-5", description: "RUT de cliente; se normaliza a 12345678-5" }
 *         products:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId: { type: string, format: uuid }
 *               quantity:  { type: integer, minimum: 1 }
 *     OrderCreateBySupplierRutInput:
 *       type: object
 *       required: [supplierRut, customerId, products]
 *       properties:
 *         supplierRut: { type: string, example: "76.543.210-9" }
 *         customerId:  { type: string, format: uuid }
 *         products:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId: { type: string, format: uuid }
 *               quantity:  { type: integer, minimum: 1 }
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create order
 *     tags: [Orders]
 *     security: [ { bearerAuth: [] } ]
 *     description: |
 *       - **admin** o **vendedor**: pueden crear órdenes para cualquier `customerId`.
 *       - **user**: solo puede crear órdenes para su propio `customerId`.
 *       - El sistema define `status="pending"` y calcula `totalAmount`. Puede marcar `isBackorder` si el stock queda negativo.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/OrderCreateInput" }
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orderId:     { type: string, format: uuid }
 *                 totalAmount: { type: number, format: float, example: 25980.00 }
 *                 status:      { type: string, example: "pending" }
 *                 isBackorder: { type: boolean, example: false }
 *                 products:
 *                   type: array
 *                   items: { $ref: "#/components/schemas/OrderItem" }
 *       400: { description: At least one product is required / datos inválidos }
 *       401: { description: Unauthorized }
 *       403: { description: You can only create orders for yourself }
 *
 *   get:
 *     summary: List orders
 *     tags: [Orders]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: Array of orders (con items)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: "#/components/schemas/Order" }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Order with items
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Order" }
 *       404: { description: Order not found }
 *       401: { description: Unauthorized }
 *
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/OrderStatusUpdate" }
 *     responses:
 *       200:
 *         description: Order updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Order updated" }
 *                 order:   { $ref: "#/components/schemas/Order" }
 *       404: { description: Order not found }
 *       409: { description: Cannot revert a completed order to pending }
 *       401: { description: Unauthorized }
 *
 *   delete:
 *     summary: Delete order and restore stock
 *     tags: [Orders]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Order deleted and stock restored
 *       404: { description: Order not found }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /orders/by-rut:
 *   post:
 *     summary: Create order by client RUT
 *     tags: [Orders]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/OrderCreateByRutInput" }
 *     responses:
 *       201: { description: Igual que POST /orders (reutiliza createOrder internamente) }
 *       400: { description: Datos inválidos }
 *       404: { description: Cliente no encontrado }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /orders/by-rut/{rut}:
 *   get:
 *     summary: List orders by client RUT
 *     tags: [Orders]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: rut
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: ["pending","processing","completed","cancelled"] }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Orders for the given client
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 client:
 *                   type: object
 *                   properties:
 *                     id:   { type: string, format: uuid }
 *                     rut:  { type: string }
 *                     name: { type: string }
 *                 orders:
 *                   type: array
 *                   items: { $ref: "#/components/schemas/Order" }
 *       400: { description: Datos inválidos }
 *       404: { description: Cliente no encontrado }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /orders/by-supplier-rut:
 *   post:
 *     summary: Create order by supplier RUT (validates that all products belong to that supplier)
 *     tags: [Orders]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/OrderCreateBySupplierRutInput" }
 *     responses:
 *       201: { description: Igual que POST /orders (reutiliza createOrder internamente) }
 *       400: { description: Productos no pertenecen al proveedor indicado / datos inválidos }
 *       404: { description: Proveedor o productos no encontrados }
 *       401: { description: Unauthorized }
 */
