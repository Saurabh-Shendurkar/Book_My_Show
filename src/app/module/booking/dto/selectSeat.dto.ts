import {z} from "zod"

export const selectSeatDto= z.object({
    seatId:z.uuid(),
    showId:z.uuid(),
})

export type selectSeatRequest= z.infer<typeof selectSeatDto>