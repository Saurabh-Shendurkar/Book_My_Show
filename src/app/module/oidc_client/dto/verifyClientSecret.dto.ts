import {z} from "zod"

export const verifyClientSecretDto= z.object({
    clientSecret:z.string().trim().max(32)
})

export type verifyClientSecretRequest= z.infer<typeof verifyClientSecretDto>