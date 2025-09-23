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
 *         id:
 *           type: string
 *           format: uuid
 *           example: "64e99fef-d7c3-4a39-bfc2-a4ad04762c68"
 *         name:        { type: string, example: "Proveedor Ejemplo" }
 *         contactName: { type: string, example: "Juan Pérez" }
 *         email:       { type: string, format: email, example: "proveedor@example.com" }
 *         phone:       { type: string, example: "+56912345678" }
 *         address:     { type: string, example: "Av. Siempre Viva 123" }
 *         website:     { type: string, format: uri, example: "https://proveedor.com" }
 *         rut:
 *           type: string
 *           example: "12345678-5"
 *           description: "Formato aceptado: 12.345.678-5 o 12345678-5 (se normaliza a 12345678-5)"
 *         paymentTerms: { type: string, example: "30 días" }
 *         categories:
 *           type: array
 *           items: { type: string }
 *           example: ["Electrónica","Papelería"]
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           example: "active"
 *         notes: { type: string, example: "Proveedor confiable con entrega rápida." }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *
 *     SupplierInput:
 *       type: object
 *       required: [name, email, phone, rut]
 *       properties:
 *         name:        { type: string, example: "Proveedor Ejemplo" }
 *         contactName: { type: string, example: "Juan Pérez" }
 *         email:       { type: string, format: email, example: "proveedor@example.com" }
 *         phone:       { type: string, example: "+56912345678" }
 *         address:     { type: string, example: "Av. Siempre Viva 123" }
 *         website:     { type: string, format: uri, example: "https://proveedor.com" }
 *         rut:
 *           type: string
 *           example: "12345678-5"
 *           description: "Puedes enviar 12.345.678-5 o 12345678-5; el backend normaliza."
 *         paymentTerms: { type: string, example: "30 días" }
 *         categories:
 *           type: array
 *           items: { type: string }
 *           example: ["Electrónica","Papelería"]
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           example: "active"
 *         notes: { type: string, example: "Proveedor confiable con entrega rápida." }
 *
 *     SupplierUpdate:
 *       type: object
 *       properties:
 *         name:        { type: string, example: "Proveedor Ejemplo S.A." }
 *         contactName: { type: string, example: "Soporte Comercial" }
 *         email:       { type: string, format: email, example: "contacto@proveedor.com" }
 *         phone:       { type: string, example: "+56998765432" }
 *         address:     { type: string, example: "Av. Nueva 456" }
 *         website:     { type: string, format: uri, example: "https://prov-ejemplo.com" }
 *         rut:         { type: string, example: "12345678-5" }
 *         paymentTerms: { type: string, example: "45 días" }
 *         categories:
 *           type: array
 *           items: { type: string }
 *           example: ["Papelería"]
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           example: "active"
 *         notes: { type: string, example: "Se actualizó razón social." }
 */

/**
 * @swagger
 * /suppliers:
 *   get:
 *     summary: Get list of all suppliers
 *     tags: [Suppliers]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200:
 *         description: List of suppliers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suppliers:
 *                   type: array
 *                   items: { $ref: "#/components/schemas/Supplier" }
 *       401: { description: Unauthorized }
 *
 *   post:
 *     summary: Create a new supplier
 *     tags: [Suppliers]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/SupplierInput" }
 *           example:
 *             name: "Proveedor Ejemplo"
 *             contactName: "Juan Pérez"
 *             email: "proveedor@example.com"
 *             phone: "+56912345678"
 *             address: "Av. Siempre Viva 123"
 *             website: "https://proveedor.com"
 *             rut: "12345678-5"
 *             paymentTerms: "30 días"
 *             categories: ["Electrónica","Papelería"]
 *             status: "active"
 *             notes: "Proveedor confiable con entrega rápida."
 *     responses:
 *       201:
 *         description: Supplier created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Supplier created successfully." }
 *                 supplier: { $ref: "#/components/schemas/Supplier" }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */

/**
 * @swagger
 * /suppliers/{id}:
 *   get:
 *     summary: Get supplier by ID
 *     tags: [Suppliers]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Supplier ID
 *     responses:
 *       200:
 *         description: Supplier data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 supplier: { $ref: "#/components/schemas/Supplier" }
 *       404: { description: Supplier not found }
 *       401: { description: Unauthorized }
 *
 *   put:
 *     summary: Update supplier by ID
 *     tags: [Suppliers]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Supplier ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/SupplierUpdate" }
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Supplier updated." }
 *                 supplier: { $ref: "#/components/schemas/Supplier" }
 *       404: { description: Supplier not found }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *
 *   delete:
 *     summary: Delete supplier by ID
 *     tags: [Suppliers]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: Supplier ID
 *     responses:
 *       200:
 *         description: Supplier deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: "Supplier deleted successfully." }
 *                 supplier: { $ref: "#/components/schemas/Supplier" }
 *       404: { description: Supplier not found }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 */
