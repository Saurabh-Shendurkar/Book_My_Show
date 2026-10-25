import { z } from "zod";

export const verifyClientSecretDto = z.object({
  clientSecret: z.string().trim().min(1).max(128),
});

export type verifyClientSecretRequest = z.infer<typeof verifyClientSecretDto>;