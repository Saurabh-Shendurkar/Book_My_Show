import {z} from "zod"

export const generateSecretDto =z.object({
    clientPassword:z.string().max(20)
})

export type generateClientSecretRequest= z.infer<typeof generateSecretDto>