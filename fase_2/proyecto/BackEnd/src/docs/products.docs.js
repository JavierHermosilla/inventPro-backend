/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Gestión de productos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:          { type: string, format: uuid }
 *         name:        { type: string }
 *         description: { type: string, nullable: true }
 *         price:       { type: number, format: float }
 *         stock:       { type: integer, description: "Puede ser negativo (backorder habilitado)" }
 *         categoryId:  { type: string, format: uuid }
 *         createdAt:   { type: string, format: date-time }
 *         updatedAt:   { type: string, format: date-time }
 *     CreateProductInput:
 *       type: object
 *       required: [name, price, stock, categoryId]
 *       properties:
 *         name:        { type: string }
 *         description: { type: string }
 *         price:       { type: number, format: float, minimum: 0 }
 *         stock:       { type: integer }
 *         categoryId:  { type: string, format: uuid }
 */

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: Listar productos (paginado y filtros)
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
 *       - in: query
 *         name: categoryId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Lista de productos
 *   post:
 *     tags: [Products]
 *     summary: Crear producto (admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateProductInput' }
 *     responses:
 *       201:
 *         description: Producto creado
 */

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Obtener producto
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *     responses:
 *       200:
 *         description: Producto
 *       404:
 *         description: No encontrado
 *   put:
 *     tags: [Products]
 *     summary: Actualizar producto (admin)
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateProductInput' }
 *     responses:
 *       200:
 *         description: Producto actualizado
 *   delete:
 *     tags: [Products]
 *     summary: Eliminar producto (admin)
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *     responses:
 *       204:
 *         description: Eliminado
 */
