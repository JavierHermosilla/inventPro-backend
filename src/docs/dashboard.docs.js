/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Resúmenes y métricas (protegido)
 */

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Resumen general (ventas, stock, órdenes)
 *     responses:
 *       200:
 *         description: Datos del dashboard
 *       401:
 *         description: No autorizado
 */
