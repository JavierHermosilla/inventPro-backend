/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: Supplier management and retrieval
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Supplier:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 64c1fbb20a7e7a001234abcd
 *         name:
 *           type: string
 *           example: Proveedor Ejemplo
 *         contactName:
 *           type: string
 *           example: Juan Pérez
 *         email:
 *           type: string
 *           example: proveedor@example.com
 *         phone:
 *           type: string
 *           example: '+56912345678'
 *         address:
 *           type: string
 *           example: 'Av. Siempre Viva 123'
 *         website:
 *           type: string
 *           example: 'https://proveedor.com'
 *         rut:
 *           type: string
 *           example: '12.345.678-9'
 *         paymentTerms:
 *           type: string
 *           example: '30 días'
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           example: ['Electrónica', 'Papelería']
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           example: active
 *         notes:
 *           type: string
 *           example: 'Proveedor confiable con entrega rápida.'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: '2023-07-20T10:00:00.000Z'
 */

/**
 * @swagger
 * /suppliers:
 *   get:
 *     summary: Get list of all suppliers
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of suppliers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Supplier'
 *       401:
 *         description: Unauthorized
 *
 *   post:
 *     summary: Create a new supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Supplier'
 *     responses:
 *       201:
 *         description: Supplier created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Supplier'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /suppliers/{id}:
 *   get:
 *     summary: Get supplier by ID
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Supplier ID
 *     responses:
 *       200:
 *         description: Supplier data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Supplier'
 *       404:
 *         description: Supplier not found
 *       401:
 *         description: Unauthorized
 *
 *   put:
 *     summary: Update supplier by ID
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Supplier ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Supplier'
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Supplier'
 *       404:
 *         description: Supplier not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *
 *   delete:
 *     summary: Delete supplier by ID
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Supplier ID
 *     responses:
 *       200:
 *         description: Supplier deleted successfully
 *       404:
 *         description: Supplier not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
