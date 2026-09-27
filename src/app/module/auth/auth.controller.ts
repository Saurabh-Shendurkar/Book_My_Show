import type { Request, Response } from "express";
import { signIn, signUp } from "./auth.service";
import { ApiError } from "../../common/utils/api.error";
import { ApiResponse } from "../../common/utils/api.response";

const signUpHandler = async (req: Request, res: Response) => {
  const user = await signUp(req.body);
  if (!user) throw ApiError.serverFailure("User Signup Failed");
  ApiResponse.created(res, "User signed up successfully", user);
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

export { signUpHandler , signInHandler};
