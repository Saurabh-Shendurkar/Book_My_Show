import express from "express";
import { errorHandler } from "./common/middleware/error.middleware";
import authRouter from "./module/auth/auth.route"
import cookieParser from "cookie-parser";
import { authenticateMidleware } from "./module/auth/auth.middleware";

export function createApp(){
    const app = express()

    //middleware
    app.use(express.json())
    app.use(cookieParser())
    app.use(authenticateMidleware())

    //routes
    app.use("/api/auth",authRouter)

    //error-handling route at end  
    app.use(errorHandler)
    return app
}