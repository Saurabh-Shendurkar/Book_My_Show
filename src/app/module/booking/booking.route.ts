import { Router } from "express";
import { parseRequest } from "../../common/middleware/parse.middlware";
import { searchMovieDto } from "./dto/searchMovie.dto";
import { movieDetailshandler, searchMoviesHandler } from "./booking.controller";
import { movieDetailsDto } from "./dto/movieDetails.dto";

const router= Router()

router.get("/search-movies",parseRequest(searchMovieDto),searchMoviesHandler)
router.get("/movie-details/:id",parseRequest(movieDetailsDto),movieDetailshandler)

export default router