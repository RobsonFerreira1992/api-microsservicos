import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { ordersRoutes } from './modules/orders/orders.routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: true,
    ajv: {
      // Permite a keyword `example` (do OpenAPI) nos JSON Schemas das rotas.
      customOptions: { keywords: ['example'] },
    },
  });

  await app.register(sensible);

  // OpenAPI / Swagger
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Orders Service API',
        description:
          'Microsserviço de pedidos — projeto de estudo de microsserviços e mensageria.',
        version: '0.1.0',
      },
      servers: [{ url: 'http://localhost:3001', description: 'local' }],
      tags: [{ name: 'orders', description: 'Operações de pedidos' }],
    },
  });
  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: false },
  });

  app.get('/health', { schema: { tags: ['health'] } }, async () => ({
    status: 'ok',
  }));

  await app.register(ordersRoutes, { prefix: '/api' });

  return app;
}
