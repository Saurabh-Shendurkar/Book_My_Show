import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../../common/utils/api.error";
import { verifyAccessToken } from "../../common/utils/jwt.utils";

export function authenticateMidleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization;
    if (!authorization) return next(); // let it pass
    if (!authorization?.startsWith("Bearer"))
      throw ApiError.badRequest("Bearer Token must start with Bearer");
    const token = authorization?.split(" ")[1];
    if (!token) throw ApiError.unAuthorized("Missing Token");
    const user = verifyAccessToken(token);
    //@ts-ignore
    req.user = user;
    next();
  };
}

export function restrictUnAuthenticatedUser() {
  return (req: Request, res: Response, next: NextFunction) => {
    //@ts-ignore
    if (!req.user)
      throw ApiError.forbidden("User Does not have access to do this");
    next();
  };
}
