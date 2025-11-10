/**
 * @swagger
 * tags:
 *   name: ManualInventory
 *   description: Ajustes manuales de inventario (trazabilidad)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ManualInventoryInput:
 *       type: object
 *       required: [productId, type, quantity]
 *       properties:
 *         productId: { type: string, format: uuid }
 *         type: { type: string, enum: [increase, decrease] }
 *         quantity: { type: integer, minimum: 1 }
 *         reason:
 *           type: string
 *           description: Obligatorio cuando type=decrease
 *     ManualInventoryRecord:
 *       type: object
 *       properties:
 *         id:        { type: string, format: uuid }
 *         productId: { type: string, format: uuid }
 *         type:      { type: string, enum: [increase, decrease] }
 *         quantity:  { type: integer }
 *         reason:    { type: string, nullable: true }
 *         createdBy: { type: string, format: uuid }
 *         createdAt: { type: string, format: date-time }
 */

/**
 * @swagger
 * /manual-inventory:
 *   get:
 *     tags: [ManualInventory]
 *     summary: Listar ajustes manuales (paginado)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: productId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Lista de movimientos }
 *   post:
 *     tags: [ManualInventory]
 *     summary: Crear ajuste manual
 *     description: >
 *       `type=decrease` puede dejar stock < 0 y **requiere** `reason`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ManualInventoryInput' }
 *     responses:
 *       201: { description: Ajuste registrado }
 */
