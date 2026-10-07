import "dotenv/config"
import { db } from "../../common/config/db"
import type { searchMovieRequest } from "./dto/searchMovie.dto"
import { moviesTable, showsTable } from "./booking.schema"
import { ilike ,eq, and, lt} from "drizzle-orm"
import type { movieDetailsRequest } from "./dto/movieDetails.dto"
import { ApiError } from "../../common/utils/api.error"
import type { viewUpcomingShowsRequest } from "./dto/viewUpcomingShows.dto"

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
    if(!movieSearchRes) throw ApiError.notFound("No such Movie Found")
    return movieSearchRes
}

const viewUpcomingShows= async(userRequest:viewUpcomingShowsRequest)=>{
    const movieId= userRequest.movieId
    const currentDate= userRequest.currentDate
    const showSearchRes=await db.select().from(showsTable).where(and(eq(showsTable.movieId,movieId),lt(showsTable.showDate,currentDate)))
    if(showSearchRes.length===0) throw ApiError.badRequest("Currently no shows available for this Movie")
    return showSearchRes
}

export {searchMovie, movieDetails, viewUpcomingShows}