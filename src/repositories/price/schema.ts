import { z } from 'zod';

export const PriceFeedObjectSchema = z.object({
  id: z.string(),
  price_info: z.object({
    arrival_time: z.string(),
    attestation_time: z.string(),
    price_feed: z.object({
      ema_price: z.object({
        conf: z.string(),
        expo: z.object({ magnitude: z.string(), negative: z.boolean() }),
        price: z.object({ magnitude: z.string(), negative: z.boolean() }),
        timestamp: z.string(),
      }),
      price: z.object({
        conf: z.string(),
        expo: z.object({ magnitude: z.string(), negative: z.boolean() }),
        price: z.object({ magnitude: z.string(), negative: z.boolean() }),
        timestamp: z.string(),
      }),
      price_identifier: z.object({ bytes: z.string() }),
    }),
  }),
});
