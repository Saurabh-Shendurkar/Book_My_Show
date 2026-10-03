import { z } from "zod";

export const resetPasswordDto=z.object({
    token:z.string(),
    password:z.string().trim().min(8).max(20)
})

export type resetPasswordRequest=z.infer<typeof resetPasswordDto>