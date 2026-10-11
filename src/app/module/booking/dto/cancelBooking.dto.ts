import {z} from "zod"

export const cancelBookingDto=z.object({
    bookingId:z.uuid()
})

export type cancelBookingRequest= z.infer<typeof cancelBookingDto>