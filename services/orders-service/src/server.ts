import { connectRabbit } from '@app/messaging';
import { buildApp } from './app.js';
import { env } from './env.js';

async function main() {
  await connectRabbit(env.RABBITMQ_URL);
  const app = await buildApp();
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
