/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Listado, detalle y exportación de reportes
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Report:
 *       type: object
 *       properties:
 *         id:      { type: string, format: uuid }
 *         type:    { type: string, example: "sales-summary" }
 *         status:  { type: string, enum: [pending, processing, ready, failed], example: "ready" }
 *         payload: { type: object, additionalProperties: true }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CreateReportInput:
 *       type: object
 *       required: [type]
 *       properties:
 *         type:    { type: string }
 *         payload: { type: object, additionalProperties: true }
 */

/**
 * @swagger
 * /reports:
 *   get:
 *     tags: [Reports]
 *     summary: Listar reportes (paginado y filtros)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, processing, ready, failed] }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *     responses:
 *       200: { description: Lista de reportes }
 *   post:
 *     tags: [Reports]
 *     summary: Crear reporte
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateReportInput' }
 *     responses:
 *       201: { description: Reporte creado }
 */

/**
 * @swagger
 * /reports/{id}:
 *   get:
 *     tags: [Reports]
 *     summary: Obtener reporte por id
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *     responses:
 *       200: { description: Reporte }
 *       404: { description: No encontrado }
 *   put:
 *     tags: [Reports]
 *     summary: Actualizar reporte
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Reporte actualizado }
 *   delete:
 *     tags: [Reports]
 *     summary: Eliminar reporte
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *     responses:
 *       204: { description: Eliminado }
 */

/**
 * @swagger
 * /reports/{id}/export:
 *   get:
 *     tags: [Reports]
 *     summary: Exportar reporte
 *     description: Exporta a PDF o XLSX según `format`.
 *     parameters:
 *       - $ref: '#/components/parameters/UUIDId'
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [pdf, xlsx], default: pdf }
 *     responses:
 *       200:
 *         description: Archivo exportado (stream)
 *       404:
 *         description: Reporte no encontrado
 */
