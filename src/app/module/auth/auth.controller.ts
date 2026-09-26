import type { Request,Response } from "express";
import {signUp} from "./auth.service"
import { ApiError } from "../../common/utils/api.error";
import { ApiResponse } from "../../common/utils/api.response";

const signUpHandler=async(req:Request,res:Response)=>{
    const user=await signUp(req.body)
    if(!user) throw ApiError.serverFailure("User Signup Failed")
    ApiResponse.created(res,"User signed up successfully",user)
}

export {signUpHandler}