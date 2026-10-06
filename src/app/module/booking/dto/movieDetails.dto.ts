import {z} from "zod"

export const movieDetailsDto= z.object({
    id:z.string().trim()
})

export type movieDetailsRequest= z.infer<typeof movieDetailsDto>