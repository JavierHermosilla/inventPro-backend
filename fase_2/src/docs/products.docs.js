/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:          { type: string, format: uuid, example: "cfe2e2b1-3a4c-4f62-8f6e-9a2a4e3b1f3d" }
 *         name:        { type: string, example: "Lápiz HB" }
 *         sku:         { type: string, example: "LPZ-HB-001" }
 *         price:       { type: number, format: float, example: 1290 }
 *         stock:       { type: integer, example: 50 }
 *         categoryId:  { type: string, format: uuid, example: "0b4d2b3a-1c2d-4e5f-8a9b-0c1d2e3f4a5b" }
 *         createdAt:   { type: string, format: date-time }
 *         updatedAt:   { type: string, format: date-time }
 *
 *     ProductInput:
 *       type: object
 *       required: [name, sku, price, stock, categoryId]
 *       properties:
 *         name:        { type: string, example: "Lápiz HB" }
 *         sku:         { type: string, example: "LPZ-HB-001" }
 *         price:       { type: number, format: float, example: 1290 }
 *         stock:       { type: integer, example: 50 }
 *         categoryId:  { type: string, format: uuid }
 *
 *     ProductUpdate:
 *       type: object
 *       properties:
 *         name:        { type: string }
 *         sku:         { type: string }
 *         price:       { type: number, format: float }
 *         stock:       { type: integer }
 *         categoryId:  { type: string, format: uuid }
 */

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management
 */

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create product
 *     tags: [Products]
 *     security: [ { bearerAuth: [] } ]
 *     description: Solo **admin**.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/ProductInput" }
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Producto creado correctamente" }
 *                 product: { $ref: "#/components/schemas/Product" }
 *       400: { description: Datos inválidos }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       409: { description: Producto con mismo nombre o SKU ya existe }
 *
 *   get:
 *     summary: List products (paginated)
 *     tags: [Products]
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
 *         description: Búsqueda por nombre/SKU (ILIKE)
 *     responses:
 *       200:
 *         description: Paged list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:   { type: integer, example: 42 }
 *                 page:    { type: integer, example: 1 }
 *                 pages:   { type: integer, example: 5 }
 *                 products:
 *                   type: array
 *                   items: { $ref: "#/components/schemas/Product" }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Product
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Product" }
 *       404: { description: Producto no encontrado }
 *       401: { description: Unauthorized }
 *
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     security: [ { bearerAuth: [] } ]
 *     description: Solo **admin**.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/ProductUpdate" }
 *     responses:
 *       200:
 *         description: Product updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Producto actualizado correctamente" }
 *                 product: { $ref: "#/components/schemas/Product" }
 *       400: { description: Datos inválidos }
 *       404: { description: Producto no encontrado }
 *       401: { description: Unauthorized }
 *       409: { description: Nombre o SKU ya en uso por otro producto }
 *
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
 *     security: [ { bearerAuth: [] } ]
 *     description: Solo **admin**. Soft delete (paranoid).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Mensaje de eliminación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Producto eliminado correctamente" }
 *       404: { description: Producto no encontrado }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
