import { ApiError } from "../utils/api.error";
import type { Request, Response, NextFunction } from "express";
import {z} from "zod"

export const parseRequest = (Dto: z.ZodType) => {
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
        .map((issue: z.core.$ZodIssue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(",\n");
        return next(ApiError.badRequest(`Invalid Request : ${errorMessage}`))
    }
    req.body = parseRes.data;
    next();
  };
};
