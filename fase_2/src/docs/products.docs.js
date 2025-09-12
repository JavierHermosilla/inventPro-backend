/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - stock
 *       properties:
 *         _id:
 *           type: string
 *           example: 64c1fbb20a7e7a001234abcd
 *         name:
 *           type: string
 *           example: Producto Ejemplo
 *         description:
 *           type: string
 *           example: Descripción del producto
 *         price:
 *           type: number
 *           example: 12000
 *         stock:
 *           type: number
 *           example: 100
 *         category:
 *           type: string
 *           example: Electrónica
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: '2023-07-20T10:00:00.000Z'
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: '2023-07-20T12:00:00.000Z'
 *     ProductUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         stock:
 *           type: number
 *         category:
 *           type: string
 */
