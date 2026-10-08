import "dotenv/config"
import { db } from "../../common/config/db"
import type { searchMovieRequest } from "./dto/searchMovie.dto"
import { bookingsTable, moviesTable, seatsTable, showsTable } from "./booking.schema"
import { ilike ,eq, and, gte} from "drizzle-orm"
import type { movieDetailsRequest } from "./dto/movieDetails.dto"
import { ApiError } from "../../common/utils/api.error"
import type { viewUpcomingShowsRequest } from "./dto/viewUpcomingShows.dto"
import type { viewAvailableSeatsRequest } from "./dto/viewAvailableSeats.dto"

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
    const showSearchRes=await db.select().from(showsTable).where(and(eq(showsTable.movieId,movieId),gte(showsTable.showDate,currentDate)))
    if(showSearchRes.length===0) throw ApiError.badRequest("Currently no shows available for this Movie")
    return showSearchRes
}

const viewAvailableSeats=async(userRequest:viewAvailableSeatsRequest)=>{
    const showId= userRequest.showId;
    const bookingTransactions=await db.select().from(bookingsTable)
    .innerJoin(showsTable,and
        (eq(bookingsTable.showId,showsTable.showId),
        eq(showsTable.showId,showId))
    )
    const bookedSeatIds=bookingTransactions
    .filter((booking)=>booking.bookings_table.bookingStatus="Confirmed")
    .map(booking=>booking.bookings_table.seatId)

    const allTicketIds=await (await db.select().from(seatsTable)).map(seat=>seat.seatId)
    if(!allTicketIds) throw ApiError.serverFailure("Unable to fetch Seats")
    return {allTicketIds, bookedSeatIds}
}
export {searchMovie, movieDetails, viewUpcomingShows, viewAvailableSeats}