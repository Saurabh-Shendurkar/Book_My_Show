import "dotenv/config"
import { db } from "../../common/config/db"
import type { searchMovieRequest } from "./dto/searchMovie.dto"
import { moviesTable } from "./booking.schema"
import { ilike } from "drizzle-orm"

const searchMovie=async(userRequest:searchMovieRequest)=>{
    const movieName=userRequest.movieName
    const moviesDetails=await db.select().from(moviesTable).where(ilike(moviesTable.movieName,`%${movieName}%`))
    if(!moviesDetails||moviesDetails.length===0) return null
    const movieObj=moviesDetails.map((movie)=>({id:movie.movieId,name:movie.movieName}))
    return movieObj
}

export {searchMovie}