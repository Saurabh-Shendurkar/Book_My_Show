import express from "express";
import { errorHandler } from "./common/middleware/error.middleware";
import authRouter from "./module/auth/auth.route"

export function createApp(){
    const app = express()

    //middleware
    app.use(express.json())
    //routes
    app.use("/api/auth",authRouter)

    //error-handling route at at 
    app.use(errorHandler)
    return app
}