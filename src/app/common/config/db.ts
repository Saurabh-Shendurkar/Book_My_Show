import "dotenv/config"
import { drizzle } from "drizzle-orm/node-postgres"

const connectDB= async()=>{
    const db=  drizzle(process.env.DATABASE_URL!)
    return db
}

export default connectDB