import "dotenv/config";
import * as jwt from "jsonwebtoken";
import crypto from "crypto";

export type userPayload = {
  id: string;
};

const createAccessToken = (
  payload: userPayload,
  options: jwt.SignOptions = {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ||
      "15m") as jwt.SignOptions["expiresIn"],
  },
): string => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, options);
};

const verifyAccessToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
};

const createRefreshToken = (
  payload: userPayload,
  options: jwt.SignOptions = {
    expiresIn: (process.env.REFRESH_ACCESS_EXPIRY ||
      "7d") as jwt.SignOptions["expiresIn"],
  },
): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!);
};

const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_REFRESH_TOKEN!);
};

const generateToken = (expiresInMinutes: number = 15) => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  
  return { rawToken, hashedToken, expiresAt };
};

export {
  generateToken,
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
