/**
 * @swagger
 * /manual-inventory:
 *   get:
 *     summary: Obtener ajustes manuales de inventario (con filtros)
 *     tags: [ManualInventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [increase, decrease]
 *         description: Filtrar por tipo de ajuste
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filtrar por ID de producto
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: "Fecha desde (YYYY-MM-DD)"
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: "Fecha hasta (YYYY-MM-DD)"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: "Página (por defecto: 1)"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: "Cantidad por página (por defecto: 10)"
 *     responses:
 *       200:
 *         description: Lista de ajustes encontrados
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
