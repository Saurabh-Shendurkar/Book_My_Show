import { Router } from "express";
import { parseRequest } from "../../common/middleware/parse.middlware";
import { searchMovieDto } from "./dto/searchMovie.dto";
import { movieDetailsHandler, searchMoviesHandler, viewUpcomingShowsHandler } from "./booking.controller";
import { movieDetailsDto } from "./dto/movieDetails.dto";
import { viewUpcomingShowsDto } from "./dto/viewUpcomingShows.dto";

const router= Router()

router.get("/search-movies",parseRequest(searchMovieDto),searchMoviesHandler)
router.get("/movie-details/:id",parseRequest(movieDetailsDto),movieDetailsHandler)
router.get("/view-upcoming-shows/:movieId",parseRequest(viewUpcomingShowsDto),viewUpcomingShowsHandler)

export default router