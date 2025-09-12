/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - name
 *         - email
 *         - password
 *         - phone
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB unique identifier
 *           example: 64c1fbb20a7e7a001234abcd
 *         username:
 *           type: string
 *           description: Username unique for login
 *           example: johndoe
 *         name:
 *           type: string
 *           description: Full name of the user
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *           example: johndoe@example.com
 *         password:
 *           type: string
 *           format: password
 *           description: Hashed password (not returned in responses for security)
 *           example: '$2b$10$abcdef...'
 *         phone:
 *           type: string
 *           description: Contact phone number
 *           example: '+56912345678'
 *         address:
 *           type: string
 *           description: Physical address
 *           example: 123 Main St
 *         avatar:
 *           type: string
 *           format: url
 *           description: URL to the avatar image
 *           example: https://example.com/avatar.jpg
 *         role:
 *           type: string
 *           enum: [admin, user, vendedor]
 *           description: User role in the system
 *           example: user
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the user was created
 *           example: 2023-08-08T14:32:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the user was last updated
 *           example: 2023-08-20T10:12:00.000Z
 *
 *     UserInput:
 *       type: object
 *       required:
 *         - username
 *         - name
 *         - email
 *         - password
 *         - phone
 *       properties:
 *         username:
 *           type: string
 *           example: johndoe
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           example: johndoe@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: secret123
 *         phone:
 *           type: string
 *           example: '+56912345678'
 *         address:
 *           type: string
 *           example: 123 Main St
 *         avatar:
 *           type: string
 *           format: url
 *           example: https://example.com/avatar.jpg
 *         role:
 *           type: string
 *           enum: [admin, user, vendedor]
 *           example: user
 *
 *     UserUpdate:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           example: johndoe
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           example: johndoe@example.com
 *         phone:
 *           type: string
 *           example: '+56912345678'
 *         address:
 *           type: string
 *           example: 123 Main St
 *         avatar:
 *           type: string
 *           format: url
 *           example: https://example.com/avatar.jpg
 *         role:
 *           type: string
 *           enum: [admin, user, vendedor]
 *           example: user
 */
