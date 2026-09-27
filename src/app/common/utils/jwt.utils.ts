import "dotenv/config";
import * as jwt from "jsonwebtoken";
import crypto from "crypto"

interface userPayload {
  id: string;
}

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
  return jwt.verify(token, process.env.JWT_ACCESS_TOKEN!);
};

const createRefreshToken = (
  payload: userPayload,
  options: jwt.SignOptions = {
    expiresIn: (process.env.REFRESH_ACCESS_EXPIRY ||
      "7d") as jwt.SignOptions["expiresIn"],
  },
): string => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!);
};

const verifyRefreshToken= (token:string)=>{
    return jwt.verify(token,process.env.JWT_REFRESH_TOKEN!)
}

const generateToken= ()=>{
  const rawToken= crypto.randomBytes(32).toString("hex")
  const hashedToken= crypto.createHash('sha256').update(rawToken).digest('hex')
  return {rawToken, hashedToken}
}

export {generateToken, createAccessToken, createRefreshToken, verifyAccessToken, verifyRefreshToken}