import amqp, { type ChannelModel, type Channel } from 'amqplib';

export const APP_EXCHANGE = 'app.events';

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

/**
 * Conecta ao RabbitMQ e garante a existência do exchange principal.
 * Reusa a mesma conexão/canal entre chamadas (singleton por processo).
 */
export async function connectRabbit(url: string): Promise<Channel> {
  if (channel) return channel;

  connection = await amqp.connect(url);
  channel = await connection.createChannel();
  await channel.assertExchange(APP_EXCHANGE, 'topic', { durable: true });

  // Encerramento limpo quando o processo for derrubado.
  const shutdown = async () => {
    try {
      await channel?.close();
      await connection?.close();
    } catch {
      // ignore
    } finally {
      process.exit(0);
    }
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  return channel;
}

export function getChannel(): Channel {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized. Call connectRabbit() first.');
  }
  return channel;
}
