import "dotenv/config"
import { db } from "../../common/config/db"
import type { searchMovieRequest } from "./dto/searchMovie.dto"
import { moviesTable } from "./booking.schema"
import { ilike ,eq} from "drizzle-orm"
import type { movieDetailsRequest } from "./dto/movieDetails.dto"
import { ApiError } from "../../common/utils/api.error"

const searchMovie=async(userRequest:searchMovieRequest)=>{
    const movieName=userRequest.movieName
    const moviesDetails=await db.select().from(moviesTable).where(ilike(moviesTable.movieName,`%${movieName}%`))
    if(!moviesDetails||moviesDetails.length===0) return null
    const moviesObj=moviesDetails.map((movie)=>({id:movie.movieId,name:movie.movieName}))
    return moviesObj
}

const movieDetails= async(userRequest:movieDetailsRequest)=>{
    const id=userRequest.id
    const [movieSearchRes]=await db.select().from(moviesTable).where(eq(moviesTable.movieId,id))
    if(!movieSearchRes) throw ApiError.badRequest("No such Movie Found")
    return movieSearchRes
}

export {searchMovie, movieDetails}