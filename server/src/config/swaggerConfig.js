// server/src/config/swaggerConfig.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bazar Bié Okutuala API',
      version: '1.0.0',
      description: 'API for the Bazar Bié Okutuala e-commerce platform.',
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:4000/api',
        description: process.env.NODE_ENV === 'production' ? 'Servidor de Produção' : 'Servidor Local',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // files containing annotations
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
