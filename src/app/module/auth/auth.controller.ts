import type { Request, Response } from "express";
import { getMe, logout, signIn, signUp, verifyEmail } from "./auth.service";
import { ApiError } from "../../common/utils/api.error";
import { ApiResponse } from "../../common/utils/api.response";
import type { verifyEmailRequest } from "./dto/verifyEmail.dto";

const signUpHandler = async (req: Request, res: Response) => {
  const user = await signUp(req.body);
  if (!user) throw ApiError.serverFailure("User Signup Failed");
  ApiResponse.created(res, "User signed up successfully, check email to verify user", user);
};

const signInHandler = async (req: Request, res: Response) => {
  const { userObj, access_token, refresh_token } = await signIn(req.body);
  if (!userObj) throw ApiError.serverFailure("User Signin Failed");

  res.cookie("refreshToken", refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/api/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  ApiResponse.ok(res, "User Signed Successfully", { userObj, access_token });
};

const getMeHandler = async(req:Request, res:Response)=>{
  //@ts-ignore
  const user=await getMe(req.user)
  ApiResponse.ok(res,"Fetched user details successfully", user)
}

const logoutHandler=async(req:Request,res:Response)=>{
  //@ts-ignore
  const {user,accessToken}=await logout(req.user)
  res.clearCookie("refreshToken")
  ApiResponse.ok(res,"Logged out Successfully",{user, accessToken})
}

const verficationHandler= async(req:Request<{},{},{},verifyEmailRequest>,res:Response)=>{
  const user= await verifyEmail(req.query.token)
  if(!user) throw ApiError.serverFailure("user verification failed")
    ApiResponse.ok(res,"User Email is now verified",user)
}
export { signUpHandler , signInHandler, getMeHandler, logoutHandler, verficationHandler};
