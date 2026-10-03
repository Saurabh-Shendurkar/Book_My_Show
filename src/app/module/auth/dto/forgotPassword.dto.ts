import {z} from "zod" 

export const forgotPasswordDto= z.object({
    email:z.email().lowercase().trim().min(5).max(344)
})

export type forgotPasswordRequest= z.infer<typeof forgotPasswordDto>