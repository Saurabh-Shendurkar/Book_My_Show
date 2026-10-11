import { SQL, sql } from "drizzle-orm";
import { relations } from "drizzle-orm/_relations";
import { boolean, check, date, integer, numeric, pgEnum, pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "../auth/auth.schema";

export const moviesTable= pgTable("movies_table",{
    movieId:uuid("movie_id").primaryKey().defaultRandom(),
    movieName:varchar("movie_name",{length:500}).notNull().unique(),
    movieDuration:varchar("movie_duration",{length:50}).notNull(),
    priceMultiplier:numeric("price_multiplier",{mode:"number"}).notNull().default(1),
    isCurrentlyScreening:boolean("is_currently_screening").default(false).notNull(),
    cast:varchar("cast",{length:2000}).notNull(),
    directedBy:varchar("directed_by",{length:50}).notNull()
})

export const showTimeEnum=pgEnum('show_time',['9am-12pm','12pm-3pm','3pm-6pm','6pm-9pm','9pm-12am'])

export const showsTable=pgTable("shows_table",{
    showId:uuid("show_id").primaryKey().defaultRandom(),
    showDate:date('show_date',{mode:"date"}),
    showTime:showTimeEnum('show_time').notNull(),
    movieId:uuid("movie_id").notNull().references(()=>moviesTable.movieId,{onDelete:"cascade"}),
    priceMultiplier:numeric("price_multiplier",{mode:"number"}).notNull().default(1)
})

export const movieShowRelation=relations(moviesTable,({many})=>({shows:many(showsTable)}))
export const showMovieRelation=relations(showsTable,({one})=>({movie:one(moviesTable,{
    fields:[showsTable.movieId],
    references:[moviesTable.movieId]
})}))

export const seatCategoryEnum= pgEnum("seat_category",["vip",'premium','regular'])
export const seatsTable= pgTable("seats_table",{
    seatId:uuid("seat_id").primaryKey().defaultRandom(),
    seatNumber:integer("seat_number").unique().notNull(),
    seatType:seatCategoryEnum("seat_type").notNull(),
    seatPrice:integer("seat_price").notNull().generatedAlwaysAs(():SQL=>
        sql`CASE
            WHEN ${seatsTable.seatType}='vip' THEN 1000
            WHEN ${seatsTable.seatType}='premium' THEN 600
            ELSE 300
            END`)
},(table)=>[
    check('seat_number',sql`${table.seatNumber}<=30`)
])

export const bookingStatusEnum=pgEnum("booking_status",["Confirmed","Pending","Not Booked"])
export const bookingsTable= pgTable("bookings_table",{
    bookingId:uuid("booking_id").primaryKey().defaultRandom(),
    showId:uuid("show_id").notNull().references(()=>showsTable.showId,{onDelete:"cascade"}),
    seatId:uuid("seat_id").notNull().references(()=>seatsTable.seatId),
    finalPrice:numeric("final_price",{mode:"number",precision:6,scale:2}),
    userId:uuid("user_id").references(()=>usersTable.id,{onDelete:"cascade"}),
    bookingStatus:bookingStatusEnum("booking_status").default("Not Booked")
}, (table) => [
    unique("unique_show_seat_booking").on(table.showId, table.seatId)
])

export const actionEnum=pgEnum("action",["Booking","Cancellation"])
export const transactionStatusEnum=pgEnum("transaction_status_enum",["Successful","Failure"])
export const transactionsTable=pgTable("transaction_table",{
    transactionId:uuid("transaction_id").defaultRandom().primaryKey(),
    bookingId:uuid("booking_id").references(()=>bookingsTable.bookingId).notNull(),
    userId:uuid("user_id").references(()=>usersTable.id).notNull(),
    action:actionEnum("action").notNull(),
    status:transactionStatusEnum("status").notNull(),
    transactionDateTime:timestamp("transaction_date_time").defaultNow().notNull(),
    ammount:numeric("ammount",{mode:"number",precision:6,scale:2})
})
