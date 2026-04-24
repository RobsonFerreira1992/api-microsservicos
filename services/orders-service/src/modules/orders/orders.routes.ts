import type { FastifyInstance } from 'fastify';
import { createOrderSchema } from './orders.schema.js';
import { ordersService } from './orders.service.js';

// JSON Schemas usados pelo Fastify para validação E geração do Swagger.
const orderItemJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    orderId: { type: 'string', format: 'uuid' },
    productSku: { type: 'string', example: 'BOOK-001' },
    quantity: { type: 'integer', minimum: 1, example: 2 },
    priceCents: { type: 'integer', minimum: 0, example: 4990 },
  },
} as const;

const orderJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    customer: { type: 'string', example: 'Robson' },
    status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'CANCELLED'] },
    totalCents: { type: 'integer', example: 12480 },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    items: { type: 'array', items: orderItemJsonSchema },
  },
} as const;

const createOrderBodyJsonSchema = {
  type: 'object',
  required: ['customer', 'items'],
  properties: {
    customer: { type: 'string', minLength: 1, example: 'Robson' },
    items: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['productSku', 'quantity', 'priceCents'],
        properties: {
          productSku: { type: 'string', example: 'BOOK-001' },
          quantity: { type: 'integer', minimum: 1, example: 2 },
          priceCents: { type: 'integer', minimum: 0, example: 4990 },
        },
      },
    },
  },
} as const;

export async function ordersRoutes(app: FastifyInstance) {
  app.post(
    '/orders',
    {
      schema: {
        tags: ['orders'],
        summary: 'Cria um novo pedido',
        body: createOrderBodyJsonSchema,
        response: {
          201: orderJsonSchema,
          400: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              issues: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = createOrderSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          message: 'Invalid payload',
          issues: parsed.error.flatten(),
        });
      }
      const order = await ordersService.create(parsed.data);
      return reply.status(201).send(order);
    },
  );

  app.get(
    '/orders',
    {
      schema: {
        tags: ['orders'],
        summary: 'Lista todos os pedidos',
        response: {
          200: { type: 'array', items: orderJsonSchema },
        },
      },
    },
    async () => ordersService.list(),
  );

  app.get<{ Params: { id: string } }>(
    '/orders/:id',
    {
      schema: {
        tags: ['orders'],
        summary: 'Busca um pedido pelo ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: orderJsonSchema,
          404: {
            type: 'object',
            properties: { message: { type: 'string' } },
          },
        },
      },
    },
    async (request, reply) => {
      const order = await ordersService.findById(request.params.id);
      if (!order) return reply.status(404).send({ message: 'Order not found' });
      return order;
    },
  );
}
