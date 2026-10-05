import {z} from "zod"

export const searchMovieDto= z.object({
    movieName:z.string().trim().lowercase().min(1).max(500)
})

export type searchMovieRequest= z.infer<typeof searchMovieDto>