import { z } from 'zod';

export const VeScaRewardPoolSchema = z
  .object({
    reserve_ve_sca_key: z.nullable(
      z.object({
        id: z.string(),
      })
    ),
    enable_claim: z.boolean(),
  })
  .transform((value) => ({
    reserveVeScaKey: value.reserve_ve_sca_key?.id,
    isClaimEnabled: value.enable_claim,
  }));
