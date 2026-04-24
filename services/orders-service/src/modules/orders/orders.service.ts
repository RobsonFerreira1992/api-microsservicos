import { EVENTS, publishEvent, type OrderCreatedEvent } from '@app/messaging';
import { prisma } from '../../lib/prisma.js';
import type { CreateOrderInput } from './orders.schema.js';

export const ordersService = {
  async create(input: CreateOrderInput) {
    const totalCents = input.items.reduce(
      (sum, item) => sum + item.priceCents * item.quantity,
      0,
    );

    const order = await prisma.order.create({
      data: {
        customer: input.customer,
        totalCents,
        items: { create: input.items },
      },
      include: { items: true },
    });

    // Publica o evento. Se o RabbitMQ estiver fora do ar a request ainda
    // retorna sucesso (a ordem foi salva). Em produção, isso vira o padrão
    // "Outbox" para garantir entrega — fica para uma fase futura.
    try {
      const event: OrderCreatedEvent = {
        orderId: order.id,
        customer: order.customer,
        totalCents: order.totalCents,
        items: order.items.map((i) => ({
          productSku: i.productSku,
          quantity: i.quantity,
          priceCents: i.priceCents,
        })),
        createdAt: order.createdAt.toISOString(),
      };
      publishEvent(EVENTS.ORDER_CREATED, event);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[orders] failed to publish order.created:', err);
    }

    return order;
  },

  list() {
    return prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
  },
};
