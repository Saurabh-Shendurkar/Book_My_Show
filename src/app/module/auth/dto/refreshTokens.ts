import {z} from "zod"

export const refreshTokensDto= z.object({
    refreshToken:z.string()
})

export type refreshTokensRequest=z.infer<typeof refreshTokensDto>