// src/config/swagger.ts
import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Online Election System API",
      version: "1.0.0",
      description:
        "API documentation for Online Election System with role-based access control (VOTER, EC, ADMIN)",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token in the format: Bearer <token>",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            nationalId: { type: "string", example: "1234567890123" },
            firstName: { type: "string", example: "John" },
            lastName: { type: "string", example: "Doe" },
            dateOfBirth: { type: "string", format: "date-time" },
            address: { type: "string", example: "Bangkok" },
            role: {
              type: "string",
              enum: ["VOTER", "EC", "ADMIN"],
              example: "VOTER",
            },
            constituencyId: { type: "integer", example: 1, nullable: true },
          },
        },
        Constituency: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Bangkok District 1" },
            location: { type: "string", example: "Bangkok" },
            isOpen: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Party: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Democratic Party" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Candidate: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            userId: { type: "integer", example: 5 },
            candidateNumber: { type: "integer", example: 1 },
            title: { type: "string", example: "Mr." },
            firstName: { type: "string", example: "Jane" },
            lastName: { type: "string", example: "Smith" },
            imageUrl: { type: "string", example: "https://example.com/photo.jpg" },
            policy: { type: "string", example: "Policy statement" },
            partyId: { type: "integer", example: 1 },
            constituencyId: { type: "integer", example: 1 },
          },
        },
        Vote: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            userId: { type: "integer", example: 1 },
            candidateId: { type: "integer", example: 1 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error message" },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Operation successful" },
            data: { type: "object" },
          },
        },
      },
    },
    tags: [
      {
        name: "Authentication",
        description: "User authentication and authorization endpoints",
      },
      {
        name: "Admin",
        description: "Admin-only endpoints (ADMIN role required)",
      },
      {
        name: "Election",
        description:
          "Election management endpoints (EC role for mutations, public for queries)",
      },
      {
        name: "Vote",
        description: "Voting endpoints (VOTER role required)",
      },
    ],
  },
  apis: ["./src/routes/*.ts"], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
