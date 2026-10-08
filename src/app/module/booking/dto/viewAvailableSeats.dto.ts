import {z} from "zod"

export const viewAvailableSeatsDto= z.object({
    showId:z.uuid()
})

export type viewAvailableSeatsRequest= z.infer<typeof viewAvailableSeatsDto>