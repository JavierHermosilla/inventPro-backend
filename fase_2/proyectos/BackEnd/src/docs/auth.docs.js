/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación y manejo de sesión
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginInput:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email: { type: string, format: email, example: "admin@inventpro.cl" }
 *         password:
 *           type: string
 *           minLength: 8
 *           description: "Política fuerte (8+, mayúscula, minúscula, número y símbolo)"
 *           example: "Admin123!"
 *     LoginResponse:
 *       type: object
 *       properties:
 *         token: { type: string, description: "JWT Access" }
 *         refreshToken: { type: string }
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesión
 *     security: []   # no requiere JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginInput' }
 *     description: Usa las credenciales emitidas por el administrador (admin@inventpro.cl en los seeds).
 *     responses:
 *       200:
 *         description: Sesión iniciada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/LoginResponse' }
 *       401:
 *         description: Credenciales inválidas
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refrescar token
 *     description: Requiere el `refresh_token` entregado como cookie httpOnly durante el login.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: "Opcional: si no se envía también se toma desde la cookie"
 *     responses:
 *       200:
 *         description: Token refrescado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/LoginResponse' }
 *       401:
 *         description: Refresh token inválido
 */

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: Perfil del usuario autenticado
 *     description: Requiere el token JWT en la cabecera Authorization.
 *     responses:
 *       200:
 *         description: Datos del perfil
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Cerrar sesión
 *     description: Limpia la cookie `refresh_token`. Necesita JWT.
 *     responses:
 *       204:
 *         description: Sesión cerrada
 *       401:
 *         description: No autorizado
 */
