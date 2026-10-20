import {z} from "zod"

export const loginClientDto= z.object({
    clientEmail:z.email().max(322),
    clientPassword:z.string().trim().max(20)
})

export type loginClientRequest= z.infer<typeof loginClientDto>