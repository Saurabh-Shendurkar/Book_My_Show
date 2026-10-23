import {z} from "zod"

export const revokeClientSecretDto= z.object({
    clientPassword:z.string().trim().max(20)
})

export type revokeClientSecretRequest= z.infer<typeof revokeClientSecretDto>