import {z} from "zod"

export const bookSeatDto= z.object({
    bookingId:z.uuid()
})

export type bookSeatRequest= z.infer<typeof bookSeatDto>