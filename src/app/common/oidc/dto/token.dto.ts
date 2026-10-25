import { z } from "zod";

export const tokenDto = z.object({
  grant_type: z.enum(["authorization_code", "refresh_token"]),
  code: z.string().trim().optional(),
  redirect_uri: z.string().trim().optional(),
  client_id: z.string().trim().optional(),
  client_secret: z.string().trim().optional(),
  code_verifier: z.string().trim().optional(),
  refresh_token: z.string().trim().optional(),
});

export type TokenRequest = z.infer<typeof tokenDto>;
