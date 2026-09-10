import express from "express";
import { errorHandler } from "./common/middleware/error.middleware";

export function createApp(){
    const app = express()

    //middleware

    //routes

    //error-handling route at at 
    app.use(errorHandler)
    return app
}