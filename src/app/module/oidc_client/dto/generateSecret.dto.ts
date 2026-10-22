import {z} from "zod"

export const generateSecretDto =z.object({
    clientEmail:z.email().max(322),
    clientPassword:z.string().max(20)
})

export type generateClientSecretRequest= z.infer<typeof generateSecretDto>