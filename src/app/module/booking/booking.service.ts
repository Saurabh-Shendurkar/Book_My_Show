import "dotenv/config";
import { db } from "../../common/config/db";
import type { searchMovieRequest } from "./dto/searchMovie.dto";
import {
  bookingsTable,
  moviesTable,
  seatsTable,
  showsTable,
} from "./booking.schema";
import { ilike, eq, and, gte } from "drizzle-orm";
import type { movieDetailsRequest } from "./dto/movieDetails.dto";
import { ApiError } from "../../common/utils/api.error";
import type { viewUpcomingShowsRequest } from "./dto/viewUpcomingShows.dto";
import type { viewAvailableSeatsRequest } from "./dto/viewAvailableSeats.dto";
import type { selectSeatRequest } from "./dto/selectSeat.dto";

const searchMovie = async (userRequest: searchMovieRequest) => {
  const movieName = userRequest.movieName;
  const moviesDetails = await db
    .select()
    .from(moviesTable)
    .where(ilike(moviesTable.movieName, `${movieName}%`));
  if (!moviesDetails || moviesDetails.length === 0) return null;
  const moviesObj = moviesDetails.map((movie) => ({
    id: movie.movieId,
    name: movie.movieName,
  }));
  return moviesObj;
};

const movieDetails = async (userRequest: movieDetailsRequest) => {
  const id = userRequest.id;
  const [movieSearchRes] = await db
    .select()
    .from(moviesTable)
    .where(eq(moviesTable.movieId, id));
  if (!movieSearchRes) throw ApiError.notFound("No such Movie Found");
  return movieSearchRes;
};

const viewUpcomingShows = async (userRequest: viewUpcomingShowsRequest) => {
  const movieId = userRequest.movieId;
  const currentDate = userRequest.currentDate;
  const showSearchRes = await db
    .select()
    .from(showsTable)
    .where(
      and(
        eq(showsTable.movieId, movieId),
        gte(showsTable.showDate, currentDate),
      ),
    );
  if (showSearchRes.length === 0)
    throw ApiError.badRequest("Currently no shows available for this Movie");
  return showSearchRes;
};

const viewAvailableSeats = async (userRequest: viewAvailableSeatsRequest) => {
  const showId = userRequest.showId;

  const bookingTransactions = await db
    .select()
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.showId, showId),
        eq(bookingsTable.bookingStatus, "Confirmed"),
      ),
    );
  const bookedSeatIds = new Set(
    bookingTransactions.map((booking) => booking.seatId),
  );

  const allTickets = await db.select().from(seatsTable);
  if (!allTickets) throw ApiError.serverFailure("Unable to fetch Seats");

  const seatMatrix = allTickets.map((seat) => ({
    seatId: seat.seatId,
    seatNumber: seat.seatNumber,
    seatType: seat.seatType,
    seatPrice: seat.seatPrice,
    isBooked: bookedSeatIds.has(seat.seatId),
  }));

  return {
    showId,
    seatMatrix,
  };
};

const selectSeat = async (userRequest: selectSeatRequest, userId:string) => {
  const { seatId, showId} = userRequest;
    return await db.transaction(async (tx) => {
     // Check existing booking for this seat and show
    const [existingBooking] = await tx
      .select()
      .from(bookingsTable)
      .where(
        and(eq(bookingsTable.seatId, seatId),
         eq(bookingsTable.showId, showId)),
      );

    if (existingBooking?.bookingStatus === "Confirmed")
      throw ApiError.forbidden(
        "User cannot try to book an already booked seat",
      );
    if (existingBooking?.bookingStatus === "Pending")
      throw ApiError.forbidden(
        "User cannot try book a ticket that is currently of pending status",
      );
      //find the seat price
    const [seat] = await tx
      .select({ seatPrice: seatsTable.seatPrice })
      .from(seatsTable)
      .where(eq(seatsTable.seatId, seatId));

    if(!seat) {
        throw ApiError.notFound("No Matching seat found")
    }
    //find show and price multiplier 
    const [showAndMovieData] = await db
      .select({
        showPriceMultiplier: showsTable.priceMultiplier,
        moviePriceMultiplier: moviesTable.priceMultiplier,
      })
      .from(showsTable)
      .innerJoin(
        moviesTable,
          eq(showsTable.movieId, moviesTable.movieId),
      );
    if(!showAndMovieData){
        tx.rollback()
        throw ApiError.notFound("No such Show or Movie exists")
    }
    const moviePriceMultiplier=showAndMovieData.moviePriceMultiplier
    const showPriceMultiplier=showAndMovieData.showPriceMultiplier

// find out the final price 
    const finalPrice=seat.seatPrice*moviePriceMultiplier*showPriceMultiplier

    //final updation or insertion
    if(existingBooking){
      const [updatedBooking]=await tx.update(bookingsTable).set({userId,finalPrice,bookingStatus:"Pending"}).where(eq(bookingsTable.bookingId,existingBooking.bookingId)).returning();
      return updatedBooking
    }else{
      const [newBooking]= await tx.insert(bookingsTable).values({
        seatId,showId,userId,finalPrice,bookingStatus:"Pending"
      }).returning();
      return newBooking
    }
  });
};
export { searchMovie, movieDetails, viewUpcomingShows, viewAvailableSeats, selectSeat};
