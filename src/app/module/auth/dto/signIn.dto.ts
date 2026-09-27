import {z} from "zod";

export const signInDto= z.object({
    email:z.email().trim().min(5).max(344).lowercase(),
    password:z.string().trim().min(8).max(20)
})

export type signInRequest= z.infer<typeof signInDto>