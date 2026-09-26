import {z} from "zod";

export const signUpDto=z.object({
    firstName:z.string().trim().min(2).max(50).lowercase(),
    lastName:z.string().trim().max(50).lowercase().optional(),
    email:z.email().trim().min(5).max(344).lowercase(),
    phone_no:z.string().trim().max(15),
    password:z.string().trim().min(8).max(20)
})

export type signUpRequest= z.infer<typeof signUpDto>