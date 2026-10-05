import { Router } from "express";
import { parseRequest } from "../../common/middleware/parse.middlware";
import { searchMovieDto } from "./dto/searchMovie.dto";
import { searchMoviesHandler } from "./booking.controller";

const router= Router()

router.get("/search-movies",parseRequest(searchMovieDto),searchMoviesHandler)

export default router