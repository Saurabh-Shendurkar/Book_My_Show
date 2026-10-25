import { z } from "zod";

export const authorizeDto = z.object({
  client_id: z.string().trim().min(1, "client_id is required"),
  redirect_uri: z.string().trim().url("redirect_uri must be a valid URL"),
  response_type: z.string().trim().default("code"),
  scope: z.string().trim().default("openid profile email"),
  state: z.string().trim().optional(),
  nonce: z.string().trim().optional(),
  code_challenge: z.string().trim().optional(),
  code_challenge_method: z.enum(["S256", "plain"]).optional(),
  email: z.string().trim().optional(),
  password: z.string().optional(),
  consent: z.enum(["allow", "deny"]).optional(),
});

export type AuthorizeRequest = z.infer<typeof authorizeDto>;
