import type{ Request, Response } from "express";
import { movieDetails, searchMovie, viewAvailableSeats, viewUpcomingShows } from "./booking.service";
import { ApiResponse } from "../../common/utils/api.response";

const searchMoviesHandler=async(req:Request,res:Response)=>{
    const moviesObj= await searchMovie(req.body)
    if(moviesObj===null) ApiResponse.ok(res,"No such movies found",{})
    ApiResponse.ok(res,"Found movies with similar names",moviesObj)
}

const movieDetailsHandler= async(req:Request,res:Response)=>{
    // parseRequest merges params/query/body into req.body after validation
    const movieObj= await movieDetails(req.body) 
    ApiResponse.ok(res,`Fetch ${movieObj.movieName} Details`,movieObj)
}

const viewUpcomingShowsHandler= async(req:Request,res:Response)=>{
    const showsList= await viewUpcomingShows(req.body)
    ApiResponse.ok(res,`Fetched the list of upcoming shows for the selected Movie`,showsList)
}

const viewAvailableSeatsHandler= async(req:Request, res:Response)=>{
    const {allTicketIds, bookedSeatIds}= await viewAvailableSeats(req.body)
    ApiResponse.ok(res,"Featched the seat Matrix",{allTicketIds,bookedSeatIds})
}
export {searchMoviesHandler, movieDetailsHandler, viewUpcomingShowsHandler, viewAvailableSeatsHandler}