import type{ Request, Response } from "express";
import { movieDetails, searchMovie } from "./booking.service";
import { ApiResponse } from "../../common/utils/api.response";

const searchMoviesHandler=async(req:Request,res:Response)=>{
    const moviesObj= await searchMovie(req.body)
    if(moviesObj===null) ApiResponse.ok(res,"No such movies found",{})
    ApiResponse.ok(res,"Found movies with similar names",moviesObj)
}

const movieDetailshandler= async(req:Request,res:Response)=>{
    // parseRequest merges params/query/body into req.body after validation
    const movieObj= await movieDetails(req.body) 
    ApiResponse.ok(res,"Fetch Movie Details",movieObj)
}

export {searchMoviesHandler, movieDetailshandler}