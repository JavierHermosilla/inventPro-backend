// src/config/swagger.js
import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

// Importa todos los archivos de documentación
import '../docs/products.docs.js'
import '../docs/manualInventory.docs.js'
import '../docs/suppliers.docs.js'
import '../docs/users.docs.js'
// import '../docs/users.docs.js' // <-- agrégalo cuando lo tengas

const swaggerDefinition = {
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
  security: [
    {
      bearerAuth: []
    }
  ]
}

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js', './src/docs/*.js']
}

const swaggerSpec = swaggerJSDoc(options)

function setupSwagger (app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}

export default setupSwagger
