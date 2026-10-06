import { ApiError } from "../utils/api.error";
import type { Request, Response, NextFunction } from "express";

export const parseRequest = (Dto: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Merge path params, query params, and body so all sources
    // are validated through the DTO. Controllers can then read
    // everything from req.body in one consistent place.
    const merged = {
      ...req.params,
      ...req.query,
      ...req.body,
    };

    const parseRes = await Dto.safeParseAsync(merged);
    if (!parseRes.success) {
      const errorMessage = parseRes.error.issues
        .map((issue: any) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");

      throw ApiError.badRequest(`Invalid Request: ${errorMessage}`);
    }
    req.body = parseRes.data;
    next();
  };
};
