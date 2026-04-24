import { APP_EXCHANGE, getChannel } from './connection.js';

/**
 * Publica um evento no exchange `app.events`.
 *
 * @param routingKey ex: 'order.created'
 * @param payload    objeto serializável (vai como JSON)
 */
export function publishEvent<T>(routingKey: string, payload: T): boolean {
  const channel = getChannel();
  const buffer = Buffer.from(JSON.stringify(payload));
  return channel.publish(APP_EXCHANGE, routingKey, buffer, {
    contentType: 'application/json',
    persistent: true, // sobrevive a restart do broker
    timestamp: Date.now(),
  });
}
