import "dotenv/config"
import type{ Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/api.error";

export const errorHandler=(
    err:Error|ApiError,
    req:Request,
    res:Response,
    next:NextFunction
):void=>{
    //default status code for unhandled errors
    let statusCode=500;
    let message= "Something went wrong with the server";

    //Check if err is an existing ApiError or handled error
    if(err instanceof ApiError){
        statusCode=err.statusCode,
        message=err.message
    }else{
        //if it is a standard error like Typescript error or syntax error
            console.error("CRITICAL ERROR: ",err)
        
        if(process.env.NODE_ENV==="development") message=err.message //this will send the err message as response if it is developement 
    }

    res.status(statusCode).json({
        success:false,
        message,
        ...(process.env.NODE_ENV==="development"&&{stack:err.stack})
    })
}