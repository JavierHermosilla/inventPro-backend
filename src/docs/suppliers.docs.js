/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: Gestión de proveedores (incluye RUT chileno)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Supplier:
 *       type: object
 *       properties:
 *         id:     { type: string, format: uuid }
 *         name:   { type: string }
 *         rut:    { type: string, example: "76.123.456-7" }
 *         email:  { type: string, format: email, nullable: true }
 *         phone:  { type: string, nullable: true }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CreateSupplierInput:
 *       type: object
 *       required: [name, rut]
 *       properties:
 *         name:  { type: string }
 *         rut:   { type: string, description: "RUT válido (con guion y dígito verificador)" }
 *         email: { type: string, format: email }
 *         phone: { type: string }
 */

/**
 * @swagger
 * /suppliers:
 *   get:
 *     tags: [Suppliers]
 *     summary: Listar proveedores
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de proveedores
 *   post:
 *     tags: [Suppliers]
 *     summary: Crear proveedor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateSupplierInput' }
 *     responses:
 *       201:
 *         description: Proveedor creado
 */

/**
 * @swagger
 * /suppliers/{id}:
 *   get:
 *     tags: [Suppliers]
 *     summary: Obtener proveedor
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *     responses:
 *       200:
 *         description: Proveedor
 *       404:
 *         description: No encontrado
 *   put:
 *     tags: [Suppliers]
 *     summary: Actualizar proveedor
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateSupplierInput' }
 *     responses:
 *       200:
 *         description: Actualizado
 *   delete:
 *     tags: [Suppliers]
 *     summary: Eliminar proveedor
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *     responses:
 *       204:
 *         description: Eliminado
 */
