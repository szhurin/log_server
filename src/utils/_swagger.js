const swaggerJSDoc = require('swagger-jsdoc')

const options = {
  definition: {
    openapi: '3.0.0', // Specification (optional, defaults to swagger: '2.0')
    info: {
      title: 'Security log', // Title (required)
      version: '0.1.0', // Version (required)
      description: 'A sample API for interacting with security log component' // Description (optional)
    }
  },
  // Path to the API docs
  apis: ['./src/transports/rest.js']
}

// Initialize swagger-jsdoc -> returns validated swagger spec in json format
const swaggerSpec = swaggerJSDoc(options)

let inited = false

const init = async (server) => {
  if (inited) {
    return null
  }
  server.get('/v1/api-docs.json', (req, res) => {
    res
      .header('Content-Type', 'application/json')
      .send(swaggerSpec)
  })

  server.register(require('fastify-swagger'), {
    routePrefix: '/docs',
    mode: 'static',
    specification: {
      path: './package.json',
      postProcessor: function (swaggerObject) {
        return swaggerSpec
      }
    },
    exposeRoute: true
  })

  inited = true
  return inited
}

module.exports = {
  init
}
