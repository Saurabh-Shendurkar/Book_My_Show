import {z} from "zod"

export const verifyEmailDto=z.object({
    token:z.string()
})

export type verifyEmailRequest= z.infer<typeof verifyEmailDto>