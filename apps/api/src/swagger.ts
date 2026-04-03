import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'U-Club API',
      version: '0.0.1',
      description: 'API for the U-Club sports club management platform',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            display_name: { type: 'string' },
            bio: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            email: { type: 'string', format: 'email' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        CreateUserRequest: {
          type: 'object',
          required: ['display_name', 'email', 'password'],
          properties: {
            display_name: { type: 'string' },
            bio: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' },
          },
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            display_name: { type: 'string' },
            bio: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/**/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
