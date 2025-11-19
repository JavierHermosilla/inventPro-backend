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
 *         supplierId:  { type: string, format: uuid, description: "Proveedor dueño del producto (usar junto a categoryId)" }
 *         supplierRut: { type: string, description: "Alternativa a supplierId. Envía solo uno de los dos." }
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
 *         schema: { type: integer, minimum: 1, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, example: 50 }
 *       - in: query
 *         name: search
 *         schema: { type: string, example: "inventario" }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string, format: uuid, example: "12a52eea-cc5c-4f33-9f0f-0c8a6c1931e9" }
 *     responses:
 *       200:
 *         description: Lista de productos
 *   post:
 *     tags: [Products]
 *     summary: Crear producto (admin)
 *     description: Debes indicar `supplierId` **o** `supplierRut` (al menos uno) además del resto de campos obligatorios.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CreateProductInput'
 *             example:
 *               name: "Zapatilla Inventario"
 *               description: "Modelo edición limitada"
 *               price: 49990
 *               stock: 50
 *               categoryId: "12a52eea-cc5c-4f33-9f0f-0c8a6c1931e9"
 *               supplierId: "f1884cb9-4961-4722-bf3d-8e2f73f34a7b"
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
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CreateProductInput'
 *             example:
 *               name: "Zapatilla Inventario PRO"
 *               description: "Versión 2025"
 *               price: 54990
 *               stock: 80
 *               categoryId: "12a52eea-cc5c-4f33-9f0f-0c8a6c1931e9"
 *               supplierRut: "76.543.210-9"
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
