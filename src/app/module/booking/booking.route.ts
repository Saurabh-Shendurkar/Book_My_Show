import { Router } from "express";
import { parseRequest } from "../../common/middleware/parse.middlware";
import { searchMovieDto } from "./dto/searchMovie.dto";
import { movieDetailsHandler, searchMoviesHandler, viewAvailableSeatsHandler, viewUpcomingShowsHandler } from "./booking.controller";
import { movieDetailsDto } from "./dto/movieDetails.dto";
import { viewUpcomingShowsDto } from "./dto/viewUpcomingShows.dto";
import { viewAvailableSeatsDto } from "./dto/viewAvailableSeats.dto";

const router= Router()

router.get("/search-movies",parseRequest(searchMovieDto),searchMoviesHandler)
router.get("/movie-details/:id",parseRequest(movieDetailsDto),movieDetailsHandler)
router.get("/view-upcoming-shows/:movieId",parseRequest(viewUpcomingShowsDto),viewUpcomingShowsHandler)
router.get("/view-available-seats/:showId",parseRequest(viewAvailableSeatsDto),viewAvailableSeatsHandler)

export default router