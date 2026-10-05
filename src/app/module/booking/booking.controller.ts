import type{ Request, Response } from "express";
import { searchMovie } from "./booking.service";
import { ApiResponse } from "../../common/utils/api.response";

const searchMoviesHandler=async(req:Request,res:Response)=>{
    const movieObj= await searchMovie(req.body)
    if(movieObj===null) ApiResponse.ok(res,"No such movies found",{})
    ApiResponse.ok(res,"Found movies with similar names",movieObj)
}

export {searchMoviesHandler}