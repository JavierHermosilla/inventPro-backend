// src/config/swagger.js
import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const definition = {
  openapi: '3.0.0',
  info: {
    title: 'InventPro API',
    version: '1.0.0',
    description: 'Documentación de la API para el sistema InventPro'
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Servidor local'
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

export default function setupSwagger (app) {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true, // mantiene el JWT después de recargar
        tagsSorter: 'alpha', // ordena los TAGS alfabéticamente
        operationsSorter: 'alpha' // ordena las operaciones dentro de cada tag
      }
    })
  )
}
