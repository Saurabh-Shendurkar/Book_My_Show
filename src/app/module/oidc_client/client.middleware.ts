import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../../common/utils/api.error";

export function restrictUnAuthenticatedClient() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unAuthorized("Client authentication required");
    }
    next();
  };
}
