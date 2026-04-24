import { EVENTS, subscribe, type OrderCreatedEvent } from '@app/messaging';
import { notificationsService } from './notifications.service.js';

export async function startNotificationsSubscriber() {
  await subscribe<OrderCreatedEvent>(
    {
      queue: 'notifications.order-created',
      patterns: [EVENTS.ORDER_CREATED],
      prefetch: 10,
    },
    async (event) => {
      // eslint-disable-next-line no-console
      console.log(`[notifications] received ${EVENTS.ORDER_CREATED}`, event.orderId);
      notificationsService.send({
        channel: 'email',
        recipient: `${event.customer.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        message: `Olá ${event.customer}, seu pedido ${event.orderId} foi criado! Total: R$ ${(
          event.totalCents / 100
        ).toFixed(2)}`,
      });
    },
  );
}
