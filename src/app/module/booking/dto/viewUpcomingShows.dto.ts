import {z} from "zod";

export const viewUpcomingShowsDto= z.object({
    movieId:z.uuid(),
    currentDate:z.coerce.date().default(()=>new Date())
})

export type viewUpcomingShowsRequest= z.infer<typeof viewUpcomingShowsDto>