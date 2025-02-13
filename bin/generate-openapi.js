import swaggerJsdoc from 'swagger-jsdoc';

/*
 * Usage: npm run generate-openapi | tail -n1 > x.json
 *
 * Inspect generated file by opening it in https://editor-next.swagger.io/
 *
 */

const options = {
  definition: {
    openapi: '3.1.1',
    info: {
      title: 'Trilium Notes - Sync server API',
      version: '0.96.6',
      description: "This is the internal sync server API used by Trilium Notes / TriliumNext Notes.\n\n_If you're looking for the officially supported External Trilium API, see [here](https://triliumnext.github.io/Docs/Wiki/etapi.html)._\n\nThis page does not yet list all routes. For a full list, see the [route controller](https://github.com/TriliumNext/Notes/blob/v0.91.6/src/routes/routes.ts).",
      contact: {
        name: "TriliumNext issue tracker",
        url: "https://github.com/TriliumNext/Notes/issues",
      },
      license: {
        name: "GNU Free Documentation License 1.3 (or later)",
        url: "https://www.gnu.org/licenses/fdl-1.3",
      },
    },
  },
  apis: [
    // Put individual files here to have them ordered first.
    './src/routes/api/setup.ts',
    // all other files
    './src/routes/api/*.ts', './bin/generate-openapi.js'
  ],
};

const openapiSpecification = swaggerJsdoc(options);

console.log(JSON.stringify(openapiSpecification));

/**
 * @swagger
 * tags:
 *   - name: auth
 *     description: Authentication
 *   - name: sync
 *     description: Synchronization
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     EntityChange:
 *       type: object
 *       properties:
 *         entityChange:
 *           type: object
 *           properties:
 *             entityName:
 *               type: string
 *               example: "notes"
 *               description: Database table for this entity.
 *             changeId:
 *               type: string
 *               example: "changeId9630"
 *               description: ID, referenced in `entity_changes` table.
 *         entity:
 *           type: object
 *           description: Encoded entity data. Object has one property for each database column.
 *     UtcDateTime:
 *       type: string
 *       example: "2025-02-13T07:42:47.698Z"
 *   securitySchemes:
 *     user-password:
 *       type: apiKey
 *       name: trilium-cred
 *       in: header
 *       description: "Username and password, formatted as `user:password`"
 *     session:
 *       type: apiKey
 *       in: cookie
 *       name: trilium.sid
 */
