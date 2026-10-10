import type{ Request, Response } from "express";
import { movieDetails, searchMovie, selectSeat, viewAvailableSeats, viewUpcomingShows } from "./booking.service";
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
    const {showId, seatMatrix}= await viewAvailableSeats(req.body)
    ApiResponse.ok(res,"Fetched the seat Matrix",{showId, seatMatrix})
}

const selectSeatHandler= async(req:Request,res:Response)=>{
    const userId=(req as any).user.id
    const seatDetails=await selectSeat(req.body,userId)
    ApiResponse.ok(res,"Fetched the selected seat successfully",seatDetails)
}
export {searchMoviesHandler, movieDetailsHandler, viewUpcomingShowsHandler, viewAvailableSeatsHandler, selectSeatHandler}