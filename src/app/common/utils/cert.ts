import { readFileSync } from "fs";
import path from "path";

export const PUBLIC_KEY= readFileSync(path.resolve("cert/public-key.pem"))
export const PRIVATE_KEY= readFileSync(path.resolve("cert/private-key.pem"))