import{ response, type Request, type Response } from "express";
import {jwks, oidcConfig} from "./oidc.service";
import { ApiError } from "../utils/api.error";
import { ApiResponse } from "../utils/api.response";

const oidcHandler= async(req:Request, res:Response)=>{
    const response= await oidcConfig()
    if(!response) throw ApiError.serverFailure("Unable to process the request due to unexpected error, please try again later after some time!")
    res.status(200).json(response)// use standard res because third party oidc's need statndard res
}

const jwksHandler= async(_:any,res:Response)=>{
  const jwksResponse= await jwks()
  res.status(200).json(jwksResponse)
}
export {oidcHandler, jwksHandler}
