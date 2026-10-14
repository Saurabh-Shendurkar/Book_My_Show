import type { userPayload } from "../app/common/utils/jwt.utils";

declare global {
  namespace Express {
    interface Request {
      user?: userPayload;
    }
  }
}

// This empty export is required to make this file a module
// while still allowing `declare global` to augment the Express namespace.
export {};
