import "dotenv/config"
import type{ Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/api.error";

export const errorHandler=(
    err:any,
    req:Request,
    res:Response,
    next:NextFunction
):void=>{
    let {statusCode,message}=err;

    if(!(err instanceof ApiError)){
            statusCode=500,
            message="something went wrong on the server."

            console.error("CRITICAL ERROR",err)
    }

    res.status(statusCode).json({
        success:false,
        message,
        ...(process.env.NODE_ENV==="developement"&&{stack:err.stack})
    })
}