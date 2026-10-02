import {z} from "zod"

const verifyEmailDto=z.object({
    token:z.string()
})

export type verifyEmailRequest= z.infer<typeof verifyEmailDto>