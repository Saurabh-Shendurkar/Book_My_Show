import "dotenv/config"
import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"

const db=drizzle(process.env.DATABASE_URL!)

export async function CheckDBConnection() {
    try {
        await db.execute(sql`select 1`)
        console.log(`database connection successful`)
    } catch (error) {
        console.log(`failed to connect to db : ${error}`)
        process.exit(1)
    }
}