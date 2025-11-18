// src/config/swagger.js
import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const serverUrl = process.env.SWAGGER_SERVER_URL || 'http://localhost:3000/api'

const definition = {
  openapi: '3.0.0',
  info: {
    title: 'InventPro API',
    version: '1.0.0',
    description: 'Documentación de la API para el sistema InventPro'
  },
  servers: [
    {
      url: serverUrl,
      description: serverUrl.includes('localhost')
        ? 'Servidor local'
        : 'Servidor configurado por SWAGGER_SERVER_URL'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  // seguridad por defecto → todos los endpoints requieren JWT
  // excepto los que explícitamente definan `security: []` (ej: /auth/login)
  security: [{ bearerAuth: [] }]
}

const options = {
  definition,
  apis: [
    './src/docs/**/*.{yml,yaml}',
    './src/docs/**/*.docs.js'
  ]
}

const swaggerSpec = swaggerJSDoc(options)

export default function setupSwagger (app, { protect } = {}) {
  const middlewares = []
  if (protect) {
    middlewares.push(protect)
  }

  middlewares.push(
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true, // mantiene JWT al refrescar
        tagsSorter: 'alpha', // ordena tags
        operationsSorter: 'alpha' // ordena operaciones
      }
    })
  )

  app.use('/docs', ...middlewares)
}
