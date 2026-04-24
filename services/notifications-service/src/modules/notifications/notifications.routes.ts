import type { FastifyInstance } from 'fastify';
import { notificationsService } from './notifications.service.js';

const notificationJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    channel: { type: 'string', enum: ['email', 'sms', 'push'] },
    recipient: { type: 'string', example: 'robson@example.com' },
    message: { type: 'string', example: 'Seu pedido foi criado!' },
    createdAt: { type: 'string', format: 'date-time' },
  },
} as const;

const sendBodyJsonSchema = {
  type: 'object',
  required: ['channel', 'recipient', 'message'],
  properties: {
    channel: { type: 'string', enum: ['email', 'sms', 'push'], example: 'email' },
    recipient: { type: 'string', minLength: 1, example: 'robson@example.com' },
    message: { type: 'string', minLength: 1, example: 'Seu pedido foi criado!' },
  },
} as const;

export async function notificationsRoutes(app: FastifyInstance) {
  app.post(
    '/notifications',
    {
      schema: {
        tags: ['notifications'],
        summary: 'Envia (registra) uma notificação manualmente',
        body: sendBodyJsonSchema,
        response: { 201: notificationJsonSchema },
      },
    },
    async (request, reply) => {
      const body = request.body as {
        channel: 'email' | 'sms' | 'push';
        recipient: string;
        message: string;
      };
      const notification = notificationsService.send(body);
      return reply.status(201).send(notification);
    },
  );

  app.get(
    '/notifications',
    {
      schema: {
        tags: ['notifications'],
        summary: 'Lista notificações enviadas (mais recentes primeiro)',
        response: { 200: { type: 'array', items: notificationJsonSchema } },
      },
    },
    async () => notificationsService.list(),
  );
}
