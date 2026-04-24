import { z } from 'zod';

export const createOrderSchema = z.object({
  customer: z.string().min(1),
  items: z
    .array(
      z.object({
        productSku: z.string().min(1),
        quantity: z.number().int().positive(),
        priceCents: z.number().int().nonnegative(),
      }),
    )
    .min(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
