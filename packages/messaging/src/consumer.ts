import { APP_EXCHANGE, getChannel } from './connection.js';

export type Handler<T> = (payload: T, raw: { routingKey: string }) => Promise<void> | void;

export interface SubscribeOptions {
  /** Nome da fila (durável). Use algo único por consumer/serviço. */
  queue: string;
  /** Padrões de routing key (ex: ['order.created', 'order.*']). */
  patterns: string[];
  /** Quantas mensagens em paralelo o consumer processa antes de dar ack. */
  prefetch?: number;
}

/**
 * Cria a fila, faz binding no exchange e começa a consumir.
 * - Ack manual: a mensagem só sai da fila se o handler resolver sem erro.
 * - Em caso de erro: nack sem requeue → futuramente vai pra DLQ (Fase 6).
 */
export async function subscribe<T>(
  options: SubscribeOptions,
  handler: Handler<T>,
): Promise<void> {
  const channel = getChannel();

  await channel.assertQueue(options.queue, { durable: true });
  for (const pattern of options.patterns) {
    await channel.bindQueue(options.queue, APP_EXCHANGE, pattern);
  }
  await channel.prefetch(options.prefetch ?? 10);

  await channel.consume(
    options.queue,
    async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString()) as T;
        await handler(payload, { routingKey: msg.fields.routingKey });
        channel.ack(msg);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[messaging] handler failed:', err);
        channel.nack(msg, false, false);
      }
    },
    { noAck: false },
  );
}
