import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { notificationsRoutes } from './modules/notifications/notifications.routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: true,
    ajv: { customOptions: { keywords: ['example'] } },
  });

  await app.register(sensible);

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Notifications Service API',
        description:
          'Microsserviço de notificações — receberá eventos do orders-service via RabbitMQ na Fase 3.',
        version: '0.1.0',
      },
      servers: [{ url: 'http://localhost:3002', description: 'local' }],
      tags: [{ name: 'notifications', description: 'Operações de notificações' }],
    },
  });
  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: false },
  });

  app.get('/health', { schema: { tags: ['health'] } }, async () => ({
    status: 'ok',
  }));

  await app.register(notificationsRoutes, { prefix: '/api' });

  return app;
}
