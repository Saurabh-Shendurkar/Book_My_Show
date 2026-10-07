import {z} from "zod";

export const viewUpcomingShowsDto= z.object({
    movieId:z.uuid(),
    currentDate:z.date()
})

export type viewUpcomingShowsRequest= z.infer<typeof viewUpcomingShowsDto>