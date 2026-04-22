import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Eggplant API',
      version: '0.0.1',
      description: 'API for the Eggplant sports club management platform',
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
            role: { type: 'string', enum: ['admin', 'manager', 'user'] },
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
            categoryId: { type: 'string', format: 'uuid', nullable: true },
            label: { type: 'string' },
            gender: { type: 'string', enum: ['male', 'female', 'mixed'] },
            description: { type: 'string', nullable: true },
            categoryLabel: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateTeamRequest: {
          type: 'object',
          required: ['clubId', 'label', 'gender'],
          properties: {
            clubId: { type: 'string', format: 'uuid' },
            categoryId: { type: 'string', format: 'uuid', nullable: true },
            label: { type: 'string' },
            gender: { type: 'string', enum: ['male', 'female', 'mixed'] },
            description: { type: 'string', nullable: true },
          },
        },
        UpdateTeamRequest: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            categoryId: { type: 'string', format: 'uuid', nullable: true },
            gender: { type: 'string', enum: ['male', 'female', 'mixed'] },
            description: { type: 'string', nullable: true },
          },
        },
        TeamCategory: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            clubId: { type: 'string', format: 'uuid' },
            label: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateTeamCategoryRequest: {
          type: 'object',
          required: ['clubId', 'label'],
          properties: {
            clubId: { type: 'string', format: 'uuid' },
            label: { type: 'string' },
          },
        },
        UpdateTeamCategoryRequest: {
          type: 'object',
          properties: {
            label: { type: 'string' },
          },
        },
        MemberStatus: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            label: { type: 'string' },
          },
        },
        Member: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            statusId: { type: 'string', format: 'uuid', nullable: true },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            birthdate: { type: 'string', format: 'date', nullable: true },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'mixed'],
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateMemberRequest: {
          type: 'object',
          required: ['firstName', 'lastName', 'gender'],
          properties: {
            statusId: { type: 'string', format: 'uuid', nullable: true },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            birthdate: { type: 'string', format: 'date', nullable: true },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'mixed'],
            },
          },
        },
        UpdateMemberRequest: {
          type: 'object',
          properties: {
            statusId: { type: 'string', format: 'uuid', nullable: true },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            birthdate: { type: 'string', format: 'date', nullable: true },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'mixed'],
            },
          },
        },
        TeamAssignment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            teamId: { type: 'string', format: 'uuid' },
            memberId: { type: 'string', format: 'uuid' },
            role: {
              type: 'string',
              enum: ['player', 'coach', 'assistant', 'sparring'],
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        UserMember: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            memberId: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['self', 'relative'] },
            description: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        MemberInvitation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            memberId: { type: 'string', format: 'uuid' },
            invitedBy: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            type: { type: 'string', enum: ['self', 'relative'] },
            description: { type: 'string', nullable: true },
            expiresAt: { type: 'string', format: 'date-time' },
            acceptedAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        PaginationMeta: {
          type: 'object',
          required: ['page', 'itemsPerPage', 'totalItems', 'totalPages'],
          properties: {
            page: { type: 'integer', minimum: 1 },
            itemsPerPage: { type: 'integer', minimum: 1 },
            totalItems: { type: 'integer', minimum: 0 },
            totalPages: { type: 'integer', minimum: 1 },
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
