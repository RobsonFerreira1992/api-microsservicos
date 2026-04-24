import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(3002),
  HOST: z.string().default('0.0.0.0'),
  RABBITMQ_URL: z.string().url(),
});

export const env = schema.parse(process.env);
