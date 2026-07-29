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

const PriceSchema = z.object({
  feed_id: z.string(),
  price: z.string(),
  conf: z.string(),
  expo: z.number(),
  publish_time: z.number(),
  received_at: z.number(),
});

export const IndexerApiResponse = z.object({
  prices: z.record(z.string(), PriceSchema),
  data: z
    .object({
      encoding: z.string(),
      data: z.array(z.string()),
    })
    .transform((data) => ({
      encoding: data.encoding,
      data: data.data[0], // For now the response only contains one element
    })),
  updatedAt: z.number(),
});

export type IndexerApiResponseType = z.infer<typeof IndexerApiResponse>;
