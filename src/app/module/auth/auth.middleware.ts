import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../../common/utils/api.error";
import { verifyAccessToken, type userPayload } from "../../common/utils/jwt.utils";

export function authenticateMidleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;
    const authorization = req.headers.authorization;

    if (authorization) {
      if (authorization.startsWith("Bearer ")) {
        token = authorization.split(" ")[1];
      } else {
        // If it's another auth scheme (e.g. Basic Auth for client_secret_basic), pass through
        return next();
      }
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) return next();

    try {
      const decoded = verifyAccessToken(token) as userPayload;
      req.user = decoded;
      next();
    } catch (error) {
      // If token is invalid or expired, continue without req.user;
      // restrictUnAuthenticatedUser will catch protected endpoints
      next();
    }
  };
}

export function restrictUnAuthenticatedUser() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unAuthorized("User does not have access or is not authenticated");
    }
    next();
  };
}
