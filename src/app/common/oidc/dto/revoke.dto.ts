import { z } from "zod";

export const revokeDto = z.object({
  token: z.string().trim().min(1, "token is required"),
  token_type_hint: z.enum(["access_token", "refresh_token"]).optional(),
  client_id: z.string().trim().optional(),
  client_secret: z.string().trim().optional(),
});

export type RevokeRequest = z.infer<typeof revokeDto>;
