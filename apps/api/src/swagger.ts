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
            displayName: { type: 'string' },
            bio: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            email: { type: 'string', format: 'email' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateUserRequest: {
          type: 'object',
          required: ['displayName', 'email', 'password'],
          properties: {
            displayName: { type: 'string' },
            bio: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' },
          },
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            displayName: { type: 'string' },
            bio: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' },
          },
        },
        Club: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            code: { type: 'string' },
            description: { type: 'string', nullable: true },
            mediaLogoLg: { type: 'string', nullable: true },
            mediaLogoSm: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateClubRequest: {
          type: 'object',
          required: ['name', 'code'],
          properties: {
            name: { type: 'string' },
            code: { type: 'string' },
            description: { type: 'string', nullable: true },
            mediaLogoLg: { type: 'string', nullable: true },
            mediaLogoSm: { type: 'string', nullable: true },
          },
        },
        UpdateClubRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            code: { type: 'string' },
            description: { type: 'string', nullable: true },
            mediaLogoLg: { type: 'string', nullable: true },
            mediaLogoSm: { type: 'string', nullable: true },
          },
        },
        Team: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            clubId: { type: 'string', format: 'uuid' },
            label: { type: 'string' },
            year: { type: 'integer' },
            gender: { type: 'string', enum: ['male', 'female', 'both'] },
            description: { type: 'string', nullable: true },
            archived: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateTeamRequest: {
          type: 'object',
          required: ['clubId', 'label', 'year', 'gender'],
          properties: {
            clubId: { type: 'string', format: 'uuid' },
            label: { type: 'string' },
            year: { type: 'integer' },
            gender: { type: 'string', enum: ['male', 'female', 'both'] },
            description: { type: 'string', nullable: true },
          },
        },
        UpdateTeamRequest: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            year: { type: 'integer' },
            gender: { type: 'string', enum: ['male', 'female', 'both'] },
            description: { type: 'string', nullable: true },
            archived: { type: 'boolean' },
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
