import "dotenv/config"
import { createServer } from "node:http"
import { createApp } from "./app/app"
import connectDB from "./app/common/config/db"

const PORT=process.env.PORT||5000

const start = async ()=>{
    const server=createServer(createApp())
    server.listen(PORT,()=>{
        console.log(`server started on ${PORT}`);
    })

    await connectDB()
}

start().catch(err=>{
    console.log(`server failed to start due to : ${err}`)
    process.exit(1)
})
