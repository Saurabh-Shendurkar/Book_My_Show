import { ApiError } from "../utils/api.error";
import type { Request, Response, NextFunction } from "express";

export const parseRequest = (Dto: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const parseRes = await Dto.safeParseAsync(req.body);
    if (!parseRes.success) {
      const errorMessage = parseRes.error.issues
        .map((issue: any) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");

      throw ApiError.badRequest(`Invalid Request Body:${errorMessage}`);
    }
    req.body = parseRes.data;
    next();
  };
};
