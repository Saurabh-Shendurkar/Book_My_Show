import {z} from "zod"

export const registerClientDto= z.object({
    clientEmail:z.email().trim().max(322),
    clientFirstName:z.string().trim().max(50),
    clientLastName:z.string().trim().max(50).optional(),
    clientMobileNo:z.string().trim().max(15),
    clientPassword:z.string().trim().max(20)
})

export type registerClientRequest=z.infer<typeof registerClientDto>