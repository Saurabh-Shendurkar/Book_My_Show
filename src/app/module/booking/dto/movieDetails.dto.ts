import {z} from "zod"

export const movieDetailsDto= z.object({
    id:z.uuid()
})

export type movieDetailsRequest= z.infer<typeof movieDetailsDto>